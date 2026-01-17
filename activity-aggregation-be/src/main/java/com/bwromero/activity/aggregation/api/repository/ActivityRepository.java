package com.bwromero.activity.aggregation.api.repository;

import com.bwromero.activity.aggregation.api.model.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long>, ActivityRepositoryCustom {
    // Look at that! Clean as a whistle.
}
