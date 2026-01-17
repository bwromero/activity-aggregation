package com.bwromero.activity.aggregation.api;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;

import java.util.concurrent.TimeUnit;

@SpringBootApplication
@EnableCaching
public class ActivityAggregationApplication {

    public static void main(String[] args) {
        SpringApplication.run(ActivityAggregationApplication.class, args);
    }

    /**
     * Manual configuration of Caffeine Cache Manager.
     * This provides high-performance in-memory caching for our aggregation results.
     */
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("activities");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .maximumSize(1000));
        return cacheManager;
    }
}