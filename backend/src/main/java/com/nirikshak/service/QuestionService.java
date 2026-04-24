package com.nirikshak.service;

import com.nirikshak.model.Question;
import com.nirikshak.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;

    /**
     * Returns all questions for a given exam, ordered by creation time.
     * Returns an empty list (not 404) if the exam has no questions — caller decides.
     */
    public List<Question> getQuestionsForExam(String examId) {
        List<Question> questions = questionRepository.findByExamIdOrderByCreatedAtAsc(examId);
        log.debug("Fetched {} questions for examId={}", questions.size(), examId);
        return questions;
    }
}
