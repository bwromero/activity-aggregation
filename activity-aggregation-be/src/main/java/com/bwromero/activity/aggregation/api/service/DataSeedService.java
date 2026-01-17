package com.bwromero.activity.aggregation.api.service;

import com.bwromero.activity.aggregation.api.model.Activity;
import com.bwromero.activity.aggregation.api.model.Employee;
import com.bwromero.activity.aggregation.api.model.Project;
import com.bwromero.activity.aggregation.api.repository.ActivityRepository;
import com.bwromero.activity.aggregation.api.repository.EmployeeRepository;
import com.bwromero.activity.aggregation.api.repository.ProjectRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataSeedService {

    private final ActivityRepository actRepo;
    private final ProjectRepository projRepo;
    private final EmployeeRepository empRepo;
    private final EntityManager entityManager;

    @Transactional
    public void resetAndSeedDatabase(int totalRows, int batchSize) {
        log.info("Cleaning database...");
        entityManager.createNativeQuery("TRUNCATE TABLE activity, project, employee RESTART IDENTITY CASCADE").executeUpdate();

        List<Project> projects = seedProjects(20);
        List<Employee> employees = seedEmployees(50);
        seedActivities(projects, employees, totalRows, batchSize);
    }

    private List<Project> seedProjects(int count) {
        List<Project> projects = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            projects.add(projRepo.save(new Project(null, String.format("Project %02d", i))));
        }
        return projects;
    }

    private List<Employee> seedEmployees(int count) {
        List<Employee> employees = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            employees.add(empRepo.save(new Employee(null, String.format("Employee %02d", i))));
        }
        return employees;
    }

    private void seedActivities(List<Project> projects, List<Employee> employees, int totalRows, int batchSize) {
        log.info("Starting simulation of {} rows...", totalRows);
        List<Activity> batch = new ArrayList<>();

        for (int i = 1; i <= totalRows; i++) {
            batch.add(generateRandomActivity(projects, employees));

            if (i % batchSize == 0) {
                actRepo.saveAll(batch);
                actRepo.flush();
                entityManager.clear();
                batch.clear();
                if (i % 10_000 == 0) log.info("Inserted {} rows...", i);
            }
        }

        if (!batch.isEmpty()) {
            actRepo.saveAll(batch);
        }
        log.info("Simulation complete!");
    }

    private Activity generateRandomActivity(List<Project> projects, List<Employee> employees) {
        Project project = projects.get(ThreadLocalRandom.current().nextInt(projects.size()));
        Employee employee = employees.get(ThreadLocalRandom.current().nextInt(employees.size()));
        ZonedDateTime randomDate = ZonedDateTime.now().minusDays(ThreadLocalRandom.current().nextInt(365));
        int hours = ThreadLocalRandom.current().nextInt(1, 10);

        return Activity.builder()
                .project(project)
                .employee(employee)
                .date(randomDate)
                .hours(hours)
                .build();
    }
}
