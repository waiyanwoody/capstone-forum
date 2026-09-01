package com.example.communityforum.config;

import com.example.communityforum.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtil jwtUtil;
    private final StompAuthorizationChannelInterceptor stompAuthInterceptor;

    @Value("${ws.relay.enabled:false}")
    private boolean relayEnabled;

    public WebSocketConfig(JwtUtil jwtUtil,
                           StompAuthorizationChannelInterceptor stompAuthInterceptor) {
        this.jwtUtil = jwtUtil;
        this.stompAuthInterceptor = stompAuthInterceptor;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        if (relayEnabled) {
            config.enableStompBrokerRelay("/topic", "/queue")
                  .setRelayHost("localhost")
                  .setRelayPort(61613)
                  .setVirtualHost("/")
                  .setSystemLogin("guest")
                  .setSystemPasscode("guest")
                  .setClientLogin("guest")
                  .setClientPasscode("guest");
        } else {
            config.enableSimpleBroker("/topic", "/queue");
        }
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        var handshakeHandler = new CustomHandshakeHandler();

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(new JwtHandshakeInterceptor(jwtUtil))
                .setHandshakeHandler(handshakeHandler)
                .withSockJS();

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(new JwtHandshakeInterceptor(jwtUtil))
                .setHandshakeHandler(handshakeHandler);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompAuthInterceptor);
    }
}