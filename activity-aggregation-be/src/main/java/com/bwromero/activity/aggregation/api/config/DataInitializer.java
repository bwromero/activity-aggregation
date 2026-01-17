package com.bwromero.activity.aggregation.api.config;

import com.bwromero.activity.aggregation.api.service.DataSeedService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(DataSeedService seedService) {
        return args -> {
            // Configuration of volume now happens here
            seedService.resetAndSeedDatabase(100_000, 1000);
        };
    }
}
