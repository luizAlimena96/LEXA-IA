import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// ElevenLabs Usage API
// Uses elevenLabsApiKey per organization

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get("organizationId");
        const period = searchParams.get("period") || "month"; // day, week, month

        if (!organizationId) {
            return NextResponse.json(
                { error: "organizationId is required" },
                { status: 400 }
            );
        }

        // Get organization to fetch API key
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { elevenLabsApiKey: true, name: true },
        });

        if (!organization?.elevenLabsApiKey) {
            return NextResponse.json(
                { error: "ElevenLabs API Key not configured for this organization", configured: false },
                { status: 200 }
            );
        }

        // Calculate date range based on period
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case "day":
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case "week":
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "month":
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }

        // ElevenLabs uses Unix timestamps in MILLISECONDS
        const startUnix = startDate.getTime();
        const endUnix = now.getTime();

        // Build URL as tested in Postman
        // Format: https://api.elevenlabs.io/v1/usage/character-stats?start_unix=xxx&end_unix=xxx
        const apiUrl = `https://api.elevenlabs.io/v1/usage/character-stats?start_unix=${startUnix}&end_unix=${endUnix}`;

        console.log("ElevenLabs API Request URL:", apiUrl);

        // Call ElevenLabs Usage API
        const response = await fetch(apiUrl, {
            headers: {
                "xi-api-key": organization.elevenLabsApiKey,
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("ElevenLabs API error:", response.status, errorText);
            return NextResponse.json(
                { error: `ElevenLabs API error: ${response.status}`, details: errorText, configured: true },
                { status: 200 }
            );
        }

        const data = await response.json();
        console.log("ElevenLabs API Response:", JSON.stringify(data, null, 2));

        // Sum all character usage from the usage.All array
        // Response format: { usage: { All: [26042.0, 21424.0, ...] } }
        let totalCharacters = 0;

        if (data.usage && data.usage.All && Array.isArray(data.usage.All)) {
            for (const chars of data.usage.All) {
                if (typeof chars === "number") {
                    totalCharacters += chars;
                }
            }
        }

        // Calculate total cost using correct rate: $0.198 per 1000 characters
        const COST_PER_1000_CHARS = 0.198;
        const totalCost = (totalCharacters / 1000) * COST_PER_1000_CHARS;

        // Count active organizations to divide cost equally
        const activeOrgsCount = await prisma.organization.count({
            where: { isActive: true },
        });

        // Calculate cost per organization (total / active clients)
        const costPerOrg = activeOrgsCount > 0 ? totalCost / activeOrgsCount : totalCost;
        const charsPerOrg = activeOrgsCount > 0 ? Math.round(totalCharacters / activeOrgsCount) : totalCharacters;

        console.log("Total characters:", totalCharacters, "Total cost:", totalCost);
        console.log("Active organizations:", activeOrgsCount, "Cost per org:", costPerOrg);

        // Process and return the usage data
        return NextResponse.json({
            configured: true,
            period,
            startDate: startDate.toISOString().split("T")[0],
            endDate: now.toISOString().split("T")[0],
            organizationName: organization.name,
            usage: {
                totalCharactersAll: totalCharacters,
                totalCostAll: totalCost.toFixed(2),
                activeOrganizations: activeOrgsCount,
                charactersPerOrg: charsPerOrg,
                estimatedCostUSD: costPerOrg.toFixed(2),
            },
        });
    } catch (error) {
        console.error("Error fetching ElevenLabs usage:", error);
        return NextResponse.json(
            { error: "Failed to fetch ElevenLabs usage data", details: String(error) },
            { status: 500 }
        );
    }
}
