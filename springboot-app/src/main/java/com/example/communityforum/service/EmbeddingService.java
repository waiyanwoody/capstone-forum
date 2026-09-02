package com.example.communityforum.service;

import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Builds the text that gets embedded and provides cosine-similarity helpers.
 * Embeddings are normalized by the embedding service, so cosine similarity == dot product.
 */
@Service
public class EmbeddingService {

    private final RecommendationServiceClient client;

    public EmbeddingService(RecommendationServiceClient client) {
        this.client = client;
    }

    /** Compose the text representation of a post for embedding. */
    public String buildText(String title, String content, List<String> tags) {
        StringBuilder sb = new StringBuilder();
        if (title != null && !title.isBlank()) sb.append(title.trim());
        if (content != null && !content.isBlank()) {
            if (sb.length() > 0) sb.append(". ");
            String c = content.trim();
            sb.append(c.length() > 1500 ? c.substring(0, 1500) : c);
        }
        if (tags != null && !tags.isEmpty()) {
            if (sb.length() > 0) sb.append(". ");
            sb.append("tags: ").append(String.join(", ", tags));
        }
        return sb.toString().trim();
    }

    /** Embed a single text as a normalized byte[] vector, or null on failure. */
    public byte[] embedText(String text) {
        List<byte[]> result = client.embed(List.of(text));
        if (result == null || result.isEmpty()) {
            return null;
        }
        return result.get(0);
    }

    /** Dot product (== cosine since vectors are normalized). */
    public static double cosine(byte[] a, byte[] b) {
        if (a == null || b == null) return 0.0;
        float[] fa = RecommendationServiceClient.toFloats(a);
        float[] fb = RecommendationServiceClient.toFloats(b);
        int n = Math.min(fa.length, fb.length);
        double sum = 0.0;
        for (int i = 0; i < n; i++) sum += fa[i] * fb[i];
        return sum;
    }

    /** Mean of several normalized vectors, re-normalized. Returns null if none given. */
    public static byte[] meanNormalized(List<byte[]> vectors) {
        if (vectors == null || vectors.isEmpty()) return null;
        int dim = RecommendationServiceClient.toFloats(vectors.get(0)).length;
        double[] acc = new double[dim];
        for (byte[] v : vectors) {
            float[] f = RecommendationServiceClient.toFloats(v);
            for (int i = 0; i < dim && i < f.length; i++) acc[i] += f[i];
        }
        double norm = 0.0;
        for (int i = 0; i < dim; i++) norm += acc[i] * acc[i];
        norm = Math.sqrt(norm);
        if (norm == 0.0) return null;
        float[] out = new float[dim];
        for (int i = 0; i < dim; i++) out[i] = (float) (acc[i] / norm);
        return RecommendationServiceClient.toBytes(out);
    }
}
