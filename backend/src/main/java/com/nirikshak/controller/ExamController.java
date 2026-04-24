package com.nirikshak.controller;

import com.nirikshak.model.ExamSession;
import com.nirikshak.model.Question;
import com.nirikshak.service.ExamSessionService;
import com.nirikshak.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/exam")
@RequiredArgsConstructor
public class ExamController {

    private final ExamSessionService sessionService;
    private final QuestionService    questionService;

    /** GET /api/exam/{id} — fetch session details */
    @GetMapping("/{id}")
    public ResponseEntity<ExamSession> getSession(@PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.getSession(id));
    }

    /** POST /api/exam/start — start a new exam session */
    @PostMapping("/start")
    public ResponseEntity<ExamSession> startExam(
        @RequestBody Map<String, String> body,
        Authentication auth
    ) {
        String studentId = (String) auth.getDetails();
        String examId    = body.getOrDefault("examId", "GENERAL");
        ExamSession session = sessionService.createSession(UUID.fromString(studentId), examId);
        return ResponseEntity.ok(session);
    }

    /** POST /api/exam/{id}/end — end an exam session */
    @PostMapping("/{id}/end")
    public ResponseEntity<ExamSession> endExam(
        @PathVariable UUID id,
        @RequestBody(required = false) Map<String, String> body
    ) {
        String status = (body != null && body.containsKey("status")) ? body.get("status") : "COMPLETED";
        return ResponseEntity.ok(sessionService.endSession(id, status));
    }

    /**
     * POST /api/exam/{sessionId}/submit — score answers and end the session.
     * Body: { "answers": [{ "questionId": "q1", "selected": "A" }, ...] }
     * Returns: { "score": N, "totalMarks": M, "correct": K, "total": N, "passed": bool }
     * The correctAns field is used server-side only and never exposed to clients.
     */
    @PostMapping("/{sessionId}/submit")
    public ResponseEntity<Map<String, Object>> submitExam(
        @PathVariable UUID sessionId,
        @RequestBody Map<String, Object> body
    ) {
        @SuppressWarnings("unchecked")
        List<Map<String, String>> answers = (List<Map<String, String>>) body.getOrDefault("answers", List.of());

        // Fetch the session to get examId
        ExamSession session = sessionService.getSession(sessionId);
        List<Question> questions = questionService.getQuestionsForExam(session.getExamId());

        // Build a lookup map: questionId → Question
        Map<String, Question> qMap = new LinkedHashMap<>();
        for (Question q : questions) qMap.put(q.getId().toString(), q);

        int earnedMarks = 0;
        int totalMarks  = 0;
        int correct     = 0;

        for (Question q : questions) {
            totalMarks += (q.getMarks() != null ? q.getMarks() : 1);
        }

        for (Map<String, String> ans : answers) {
            String qId      = ans.get("questionId");
            String selected = ans.get("selected");
            Question q = qMap.get(qId);
            if (q != null && selected != null && selected.equalsIgnoreCase(q.getCorrectAns())) {
                earnedMarks += (q.getMarks() != null ? q.getMarks() : 1);
                correct++;
            }
        }

        // End the session as COMPLETED
        sessionService.endSession(sessionId, "COMPLETED");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("score",      earnedMarks);
        result.put("totalMarks", totalMarks);
        result.put("correct",    correct);
        result.put("total",      questions.size());
        result.put("passed",     (totalMarks > 0) && ((double) earnedMarks / totalMarks >= 0.4));
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/exam/questions/{examId} — fetch question bank for an exam.
     * correctAns is intentionally omitted from the response so students
     * cannot extract answers by inspecting network traffic.
     */
    @GetMapping("/questions/{examId}")
    public ResponseEntity<List<Map<String, Object>>> getQuestions(@PathVariable String examId) {
        List<Question> questions = questionService.getQuestionsForExam(examId);
        List<Map<String, Object>> safeQuestions = questions.stream().map(q -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",         q.getId());
            m.put("content",    q.getContent());
            m.put("optionA",    q.getOptionA());
            m.put("optionB",    q.getOptionB());
            m.put("optionC",    q.getOptionC());
            m.put("optionD",    q.getOptionD());
            m.put("difficulty", q.getDifficulty());
            m.put("marks",      q.getMarks());
            // correctAns intentionally excluded
            return m;
        }).toList();
        return ResponseEntity.ok(safeQuestions);
    }
}
