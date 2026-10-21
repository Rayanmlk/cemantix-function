const SECRET_WORD = "centrale";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

function handlePreFlightRequest(): Response {
  return new Response("Preflight OK!", {
    status: 200,
    headers: corsHeaders,
  });
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handler(_req: Request): Promise<Response> {
  if (_req.method == "OPTIONS") {
    return handlePreFlightRequest();
  }

  // the guessed word comes from the URL: https://.../?word=chien
  const word = new URL(_req.url).searchParams.get("word")?.trim().toLowerCase();
  if (!word) {
    return jsonResponse({ error: "missing 'word' query parameter" }, 400);
  }

  const headers = new Headers();
  headers.append("Content-Type", "application/json");

  const similarityRequestBody = JSON.stringify({
    word1: word,
    word2: SECRET_WORD,
  });

  const requestOptions = {
    method: "POST",
    headers: headers,
    body: similarityRequestBody,
    redirect: "follow" as RequestRedirect,
  };

  try {
    const response = await fetch("https://word2vec-ten.vercel.app/similarity", requestOptions);

    if (!response.ok) {
      // e.g. 404 when the word is not in the word2vec vocabulary
      console.error(`Error: ${response.statusText}`);
      return jsonResponse({ error: response.statusText }, response.status);
    }

    const result = await response.json();

    console.log(word, result);
    return jsonResponse(result, 200);
  } catch (error) {
    console.error("Fetch error:", error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

Deno.serve(handler);
