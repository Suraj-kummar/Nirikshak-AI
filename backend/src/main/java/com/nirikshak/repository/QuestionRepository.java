package com.nirikshak.repository;

import com.nirikshak.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface QuestionRepository extends JpaRepository<Question, UUID> {
    List<Question> findByExamIdOrderByCreatedAtAsc(String examId);
    long countByExamId(String examId);
}
