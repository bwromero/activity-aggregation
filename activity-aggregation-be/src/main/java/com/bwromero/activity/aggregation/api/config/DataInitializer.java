package com.bwromero.activity.aggregation.api.config;

import com.bwromero.activity.aggregation.api.model.Activity;
import com.bwromero.activity.aggregation.api.model.Employee;
import com.bwromero.activity.aggregation.api.model.Project;
import com.bwromero.activity.aggregation.api.repository.ActivityRepository;
import com.bwromero.activity.aggregation.api.repository.EmployeeRepository;
import com.bwromero.activity.aggregation.api.repository.ProjectRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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
import org.springframework.transaction.support.TransactionTemplate;

@Configuration
public class DataInitializer {
    @PersistenceContext
    private EntityManager entityManager;

    @Bean
    CommandLineRunner initDatabase(ActivityRepository actRepo, ProjectRepository projRepo, EmployeeRepository empRepo, TransactionTemplate transactionTemplate) {
        return args -> transactionTemplate.execute(status -> {
            System.out.println("Cleaning database and resetting IDs for a fresh start...");

            entityManager.createNativeQuery("TRUNCATE TABLE activity, project, employee RESTART IDENTITY CASCADE").executeUpdate();

            // 1. Create a pool of Projects and Employees first
            List<Project> projects = new ArrayList<>();
            for (int i = 1; i <= 20; i++) {
                // Using %02d pads the number with a zero (e.g. Project 01)
                projects.add(projRepo.save(new Project(null, String.format("Project %02d", i))));
            }

            List<Employee> employees = new ArrayList<>();
            for (int i = 1; i <= 50; i++) {
                // Using %02d ensures Employee 02 comes before Employee 10
                employees.add(empRepo.save(new Employee(null, String.format("Employee %02d", i))));
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
            return null;
        });
    }
}
