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
    public void resetAndSeedDatabase(int totalRows, int batchSize, boolean useDemoData) {
        log.info("Cleaning database...");
        entityManager.createNativeQuery("TRUNCATE TABLE activity, project, employee RESTART IDENTITY CASCADE").executeUpdate();

        if (useDemoData) {
            seedHumanDemoData();
        } else {
            List<Project> projects = seedProjects(20);
            List<Employee> employees = seedEmployees(50);
            seedActivities(projects, employees, totalRows, batchSize);
        }
    }

    private void seedHumanDemoData() {
        log.info("Seeding human-readable demo data from challenge...");
        
        // Projects
        Project marsRover = projRepo.save(new Project(null, "Mars Rover"));
        Project manhattan = projRepo.save(new Project(null, "Manhattan"));

        // Employees
        Employee mario = empRepo.save(new Employee(null, "Mario"));
        Employee giovanni = empRepo.save(new Employee(null, "Giovanni"));
        Employee lucia = empRepo.save(new Employee(null, "Lucia"));

        // Use fixed dates from the PDF (Aug/Sep 2021)
        ZonedDateTime aug27 = ZonedDateTime.parse("2021-08-27T10:00:00Z");
        ZonedDateTime aug31 = ZonedDateTime.parse("2021-08-31T10:00:00Z");
        ZonedDateTime sep01 = ZonedDateTime.parse("2021-09-01T10:00:00Z");

        List<Activity> demoActivities = List.of(
            new Activity(null, marsRover, mario, aug27, 5),
            new Activity(null, manhattan, giovanni, aug31, 3),
            new Activity(null, marsRover, mario, sep01, 3),
            new Activity(null, marsRover, lucia, sep01, 3),
            new Activity(null, manhattan, mario, aug27, 2),
            new Activity(null, manhattan, giovanni, sep01, 4)
        );

        actRepo.saveAll(demoActivities);
        log.info("Demo data seed complete!");
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
