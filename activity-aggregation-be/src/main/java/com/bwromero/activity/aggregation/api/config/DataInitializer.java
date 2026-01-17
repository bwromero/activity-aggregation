package com.bwromero.activity.aggregation.api.config;

import com.bwromero.activity.aggregation.api.service.DataSeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final DataSeedService seedService;

    @Value("${app.seed.use-demo:true}") // Default to demo data
    private boolean useDemo;

    @Value("${app.seed.total-rows:100000}")
    private int totalRows;

    @Override
    public void run(String... args) {
        seedService.resetAndSeedDatabase(totalRows, 5000, useDemo);
    }
}
