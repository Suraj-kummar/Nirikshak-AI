package com.nirikshak.config;

import com.nirikshak.controller.GlobalExceptionHandler.RateLimitExceededException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * RateLimitConfig
 * ===============
 * Per-IP token-bucket rate limiting using Bucket4j.
 *
 * Auth endpoints:  10 requests / minute per IP  (brute-force protection)
 * Analyze API:     no rate limit here (WebSocket handles frame throttling)
 *
 * Uses ConcurrentHashMap<IP, Bucket> — for production scale, replace
 * with Redis-backed Bucket4j using the bucket4j-redis module.
 */
@Slf4j
@Configuration
public class RateLimitConfig {

    // 10 requests per 60-second window per IP
    private static final int    CAPACITY         = 10;
    private static final int    REFILL_TOKENS    = 10;
    private static final Duration REFILL_PERIOD  = Duration.ofMinutes(1);

    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();

    private Bucket newBucket() {
        Bandwidth limit = Bandwidth.classic(
            CAPACITY,
            Refill.greedy(REFILL_TOKENS, REFILL_PERIOD)
        );
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket getBucketForIp(String ip) {
        return authBuckets.computeIfAbsent(ip, k -> newBucket());
    }

    @Bean
    public FilterRegistrationBean<Filter> authRateLimitFilter() {
        FilterRegistrationBean<Filter> registration = new FilterRegistrationBean<>();

        registration.setFilter(new Filter() {
            @Override
            public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
                throws IOException, ServletException {
                HttpServletRequest  httpReq = (HttpServletRequest)  req;
                HttpServletResponse httpRes = (HttpServletResponse) res;

                String ip = getClientIp(httpReq);
                Bucket bucket = getBucketForIp(ip);

                if (bucket.tryConsume(1)) {
                    chain.doFilter(req, res);
                } else {
                    log.warn("Rate limit exceeded for IP={} on {}", ip, httpReq.getRequestURI());
                    httpRes.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                    httpRes.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    httpRes.getWriter().write(
                        "{\"status\":429,\"error\":\"Too Many Requests\"," +
                        "\"message\":\"Rate limit exceeded. Max 10 requests/minute per IP.\"}"
                    );
                }
            }

            private String getClientIp(HttpServletRequest request) {
                String forwarded = request.getHeader("X-Forwarded-For");
                if (forwarded != null && !forwarded.isBlank()) {
                    return forwarded.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        });

        // Apply ONLY to auth endpoints
        registration.addUrlPatterns("/api/auth/*");
        registration.setOrder(1);  // Run before Spring Security
        return registration;
    }
}
