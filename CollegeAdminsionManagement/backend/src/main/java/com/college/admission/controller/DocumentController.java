package com.college.admission.controller;

import com.college.admission.entity.Document;
import com.college.admission.exception.ResourceNotFoundException;
import com.college.admission.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentRepository documentRepository;

    @GetMapping("/{id}/view")
    public ResponseEntity<Resource> viewDocument(@PathVariable Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        try {
            Path filePath = Paths.get(document.getFilePath()).toAbsolutePath().normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                String contentType = document.getFileType() != null ? document.getFileType() : "application/octet-stream";
                // Add inline disposition so it opens in browser instead of automatically downloading
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + document.getFileName() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException ex) {
            return ResponseEntity.badRequest().build();
        }
    }
}
