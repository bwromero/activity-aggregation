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
import java.util.HashMap;
import java.util.Map;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(ActivityRepository actRepo, ProjectRepository projRepo, EmployeeRepository empRepo) {
        return args -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(new ClassPathResource("activities.csv").getInputStream()))) {
                String line;
                boolean firstLine = true;
                Map<String, Project> projects = new HashMap<>();
                Map<String, Employee> employees = new HashMap<>();

                while ((line = reader.readLine()) != null) {
                    if (firstLine) {
                        firstLine = false;
                        continue;
                    }
                    String[] parts = line.split(",");
                    if (parts.length < 4) continue;

                    String projectName = parts[0].trim();
                    String employeeName = parts[1].trim();
                    String dateStr = parts[2].trim();
                    int hours = Integer.parseInt(parts[3].trim());

                    Project project = projects.computeIfAbsent(projectName, name -> projRepo.save(new Project(null, name)));
                    Employee employee = employees.computeIfAbsent(employeeName, name -> empRepo.save(new Employee(null, name)));

                    actRepo.save(new Activity(project, employee, ZonedDateTime.parse(dateStr), hours));
                }
            }
        };
    }
}
