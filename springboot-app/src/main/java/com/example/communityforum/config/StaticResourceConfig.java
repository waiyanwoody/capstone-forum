package com.example.communityforum.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {
    @Value("${file.upload-base-dir:uploads/}")
    private String uploadBaseDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String base = uploadBaseDir.endsWith("/") ? uploadBaseDir : uploadBaseDir + "/";
        // serves http://localhost:8080/uploads/** from file:uploads/**
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + base)
                .setCachePeriod(3600);
    }
}