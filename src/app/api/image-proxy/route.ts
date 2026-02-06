
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'; // Optional: Use Edge Runtime for lower latency if compatible, or standard Node.
// Note: 'fetch' is available in both. Standard Node runtime is safer for broader compatibility with some libs, but Edge is faster on Vercel.
// Let's stick to default (Node.js) or 'edge' if user specifically requested Serverless Function (usually implies Node or Edge).
// User said "Vercel Serverless Function". Default is Node.js.
// "runtime = 'edge'" makes it an Edge Function. Let's omit it to use the default Serverless Function (Node.js).

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
        const decodedUrl = decodeURIComponent(url);

        // Basic validation/sanitization could go here if needed.

        const response = await fetch(decodedUrl, {
            headers: {
                // Optional: mimic a browser to avoid some hotlink protections
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch image: ${response.statusText}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const arrayBuffer = await response.arrayBuffer();

        // Convert to Buffer for NextResponse (standard in App Router for binary data)
        const buffer = Buffer.from(arrayBuffer);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable', // Cache for a long time if it's an image
                'Access-Control-Allow-Origin': '*' // Allow any origin to access this proxy result if needed
            }
        });

    } catch (error) {
        console.error('Image proxy error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
