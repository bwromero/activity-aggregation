package com.bwromero.activity.aggregation.api.config;

import com.bwromero.activity.aggregation.api.model.Activity;
import com.bwromero.activity.aggregation.api.model.Employee;
import com.bwromero.activity.aggregation.api.model.Project;
import com.bwromero.activity.aggregation.api.repository.ActivityRepository;
import com.bwromero.activity.aggregation.api.repository.EmployeeRepository;
import com.bwromero.activity.aggregation.api.repository.ProjectRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(ActivityRepository actRepo, ProjectRepository projRepo, EmployeeRepository empRepo) {
        return args -> {
            // 1. Create a pool of Projects and Employees first
            if (projRepo.count() > 0) {
                System.out.println("Data already initialized. Skipping...");
                return;
            }

            List<Project> projects = new ArrayList<>();
            for (int i = 1; i <= 20; i++) {
                projects.add(projRepo.save(new Project(null, "Project " + i)));
            }

            List<Employee> employees = new ArrayList<>();
            for (int i = 1; i <= 50; i++) {
                employees.add(empRepo.save(new Employee(null, "Employee " + i)));
            }

            // 2. Generate a "shit ton" of activities
            int totalRows = 100_000;
            int batchSize = 1000;
            List<Activity> batch = new ArrayList<>();

            System.out.println("Starting data simulation of " + totalRows + " rows...");

            for (int i = 0; i < totalRows; i++) {
                Project project = projects.get(ThreadLocalRandom.current().nextInt(projects.size()));
                Employee employee = employees.get(ThreadLocalRandom.current().nextInt(employees.size()));
                ZonedDateTime randomDate = ZonedDateTime.now().minusDays(ThreadLocalRandom.current().nextInt(365));
                int hours = ThreadLocalRandom.current().nextInt(1, 10);

                batch.add(Activity.builder()
                        .project(project)
                        .employee(employee)
                        .date(randomDate)
                        .hours(hours)
                        .build());

                if (batch.size() >= batchSize) {
                    actRepo.saveAll(batch);
                    batch.clear();
                    if (i % 10_000 == 0) System.out.println("Inserted " + i + " rows...");
                }
            }
            
            if (!batch.isEmpty()) {
                actRepo.saveAll(batch);
            }

            System.out.println("Simulation complete!");
        };
    }
}
