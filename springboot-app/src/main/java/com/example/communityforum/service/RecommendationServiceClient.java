package com.example.communityforum.service;

import com.example.communityforum.config.RecommendationProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class RecommendationServiceClient {

    private static final Logger log = LoggerFactory.getLogger(RecommendationServiceClient.class);

    private final RecommendationProperties props;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public RecommendationServiceClient(RecommendationProperties props, ObjectMapper objectMapper) {
        this.props = props;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    public List<byte[]> embed(List<String> texts) {
        if (!props.isEnabled() || texts == null || texts.isEmpty()) {
            log.debug("Embed skipped: enabled={}, texts={}", props.isEnabled(), texts == null ? "null" : texts.size());
            return null;
        }
        log.info("Calling rec service /embed with {} texts, url={}", texts.size(), props.getServiceUrl());
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            Map<String, List<String>> body = Map.of("texts", texts);
            HttpEntity<Map<String, List<String>>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> resp = restTemplate.postForEntity(
                    props.getServiceUrl() + "/embed", request, String.class);

            if (resp.getStatusCode().isError() || resp.getBody() == null) {
                log.warn("Embed returned status {} body={}", resp.getStatusCode(), resp.getBody());
                return null;
            }
            JsonNode root = objectMapper.readTree(resp.getBody());
            JsonNode embeddings = root.path("embeddings");
            List<byte[]> out = new ArrayList<>(embeddings.size());
            for (JsonNode arr : embeddings) {
                float[] floats = new float[arr.size()];
                for (int i = 0; i < arr.size(); i++) {
                    floats[i] = (float) arr.get(i).asDouble();
                }
                out.add(toBytes(floats));
            }
            log.info("Embed success: {} vectors of {} dims", out.size(), out.isEmpty() ? 0 : out.get(0).length / 4);
            return out;
        } catch (Exception e) {
            log.warn("Embed error: {}", e.getMessage(), e);
            return null;
        }
    }

    public static byte[] toBytes(float[] floats) {
        ByteBuffer buf = ByteBuffer.allocate(floats.length * 4).order(ByteOrder.LITTLE_ENDIAN);
        for (float f : floats) buf.putFloat(f);
        return buf.array();
    }

    public static float[] toFloats(byte[] bytes) {
        ByteBuffer buf = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN);
        float[] floats = new float[bytes.length / 4];
        for (int i = 0; i < floats.length; i++) floats[i] = buf.getFloat();
        return floats;
    }
}
