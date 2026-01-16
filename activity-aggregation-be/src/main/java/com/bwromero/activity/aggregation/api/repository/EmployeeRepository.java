package com.bwromero.activity.aggregation.api.repository;

import com.bwromero.activity.aggregation.api.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
}
