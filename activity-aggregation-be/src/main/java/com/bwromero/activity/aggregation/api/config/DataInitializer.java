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

import java.time.ZonedDateTime;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(ActivityRepository actRepo, ProjectRepository projRepo, EmployeeRepository empRepo) {
        return args -> {
            Project p1 = projRepo.save(new Project(null, "Mars Rover"));
            Project p2 = projRepo.save(new Project(null, "Manhattan"));

            Employee e1 = empRepo.save(new Employee(null, "Mario"));
            Employee e2 = empRepo.save(new Employee(null, "Giovanni"));
            Employee e3 = empRepo.save(new Employee(null, "Lucia"));

            actRepo.saveAll(List.of(
                new Activity(p1, e1, ZonedDateTime.parse("2021-08-27T22:00:00.000Z"), 5),
                new Activity(p2, e2, ZonedDateTime.parse("2021-08-31T22:00:00.000Z"), 3),
                new Activity(p1, e1, ZonedDateTime.parse("2021-09-01T22:00:00.000Z"), 3),
                new Activity(p1, e3, ZonedDateTime.parse("2021-09-01T22:00:00.000Z"), 3),
                new Activity(p2, e1, ZonedDateTime.parse("2021-08-27T22:00:00.000Z"), 2),
                new Activity(p2, e2, ZonedDateTime.parse("2021-09-01T22:00:00.000Z"), 4)
            ));
        };
    }
}
