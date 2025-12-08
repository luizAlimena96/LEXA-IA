import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// OpenAI Usage/Costs API
// Requires: OPENAI_ADMIN_KEY in .env
// And openaiProjectId per organization

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

        // Get organization to fetch projectId
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { openaiProjectId: true, name: true },
        });

        if (!organization?.openaiProjectId) {
            return NextResponse.json(
                { error: "OpenAI Project ID not configured for this organization", configured: false },
                { status: 200 }
            );
        }

        // Get Admin Key from environment
        const adminKey = process.env.OPENAI_ADMIN_KEY;

        if (!adminKey) {
            return NextResponse.json(
                { error: "OpenAI Admin Key not configured", configured: false },
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

        // Convert to Unix seconds for OpenAI API
        const startTimeUnix = Math.floor(startDate.getTime() / 1000);
        const endTimeUnix = Math.floor(now.getTime() / 1000);

        // Build URL as tested in Postman
        // Format: https://api.openai.com/v1/organization/costs?start_time=xxx&end_time=xxx&group_by=project_id&project_ids=xxx
        const projectId = organization.openaiProjectId;
        const apiUrl = `https://api.openai.com/v1/organization/costs?start_time=${startTimeUnix}&end_time=${endTimeUnix}&group_by=project_id&project_ids=${projectId}`;

        console.log("OpenAI API Request URL:", apiUrl);

        // Call OpenAI Costs API
        const response = await fetch(apiUrl, {
            headers: {
                "Authorization": `Bearer ${adminKey}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenAI API error:", response.status, errorText);
            return NextResponse.json(
                { error: `OpenAI API error: ${response.status}`, details: errorText, configured: true },
                { status: 200 }
            );
        }

        const data = await response.json();
        console.log("OpenAI API Response:", JSON.stringify(data, null, 2));

        // Sum all daily costs from the response
        // Response format: { data: [{ results: [{ amount: { value: "0.08630..." } }] }] }
        // Note: value comes as STRING, need to parseFloat
        let totalCost = 0;

        if (data.data && Array.isArray(data.data)) {
            for (const bucket of data.data) {
                if (bucket.results && Array.isArray(bucket.results)) {
                    for (const result of bucket.results) {
                        if (result.amount && result.amount.value) {
                            // Value comes as string from API, parse it
                            const value = parseFloat(result.amount.value);
                            if (!isNaN(value)) {
                                totalCost += value;
                            }
                        }
                    }
                }
            }
        }

        console.log("Total cost:", totalCost);

        // Return the cost data
        return NextResponse.json({
            configured: true,
            period,
            startDate: startDate.toISOString().split("T")[0],
            endDate: now.toISOString().split("T")[0],
            projectId: projectId,
            organizationName: organization.name,
            totalCost: totalCost,
        });
    } catch (error) {
        console.error("Error fetching OpenAI usage:", error);
        return NextResponse.json(
            { error: "Failed to fetch OpenAI usage data", details: String(error) },
            { status: 500 }
        );
    }
}
