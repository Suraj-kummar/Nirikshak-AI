package com.nirikshak.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Configuration
public class AIVisionConfig {

    @Value("${ai.vision.service.url}")
    private String aiVisionServiceUrl;

    @Value("${ai.vision.timeout.ms:2000}")
    private int timeoutMs;

    @Bean(name = "aiVisionWebClient")
    public WebClient aiVisionWebClient() {
        return WebClient.builder()
            .baseUrl(aiVisionServiceUrl)
            .codecs(configurer ->
                configurer.defaultCodecs().maxInMemorySize(20 * 1024 * 1024) // 20 MB for frames
            )
            .build();
    }
}
