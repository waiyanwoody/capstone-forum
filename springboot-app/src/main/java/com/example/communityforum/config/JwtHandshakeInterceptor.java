package com.example.communityforum.config;

import com.example.communityforum.security.JwtUtil;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtUtil jwtUtil;

    public JwtHandshakeInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (request instanceof ServletServerHttpRequest servletRequest) {
            String authHeader = servletRequest.getServletRequest().getHeader("Authorization");
            String token = null;

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
            if (token == null) {
                token = servletRequest.getServletRequest().getParameter("token"); // support ?token=...
            }

            if (token != null) {
                try {
                    String username = jwtUtil.extractUsername(token);
                    if (username != null) {
                        attributes.put("username", username);
                        System.out.println("✅ WebSocket Authenticated User: " + username);
                        return true;
                    }
                } catch (Exception e) {
                    System.out.println("❌ Invalid JWT during WebSocket handshake: " + e.getMessage());
                }
            }
        }
        System.out.println("❌ Missing or invalid Authorization header");
        return false;
    }
    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {
        // nothing to do
    }
}
