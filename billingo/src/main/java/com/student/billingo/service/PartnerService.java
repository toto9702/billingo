package com.student.billingo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.student.billingo.dto.PartnerRequest;
import com.student.billingo.entity.Partner;
import com.student.billingo.exception.JsonConversionException;
import com.student.billingo.exception.PartnerNotFoundException;
import com.student.billingo.repository.PartnerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PartnerService {

    @Autowired
    private PartnerRepository partnerRepository;

    @Autowired
    private ObjectMapper objectMapper;

    public void savePartner(PartnerRequest partnerDto) {
        Partner partner = new Partner();
        partner.setName(partnerDto.getName());
        partner.setEmail(partnerDto.getEmail());
        partner.setPostalCode(partnerDto.getPostalCode());
        partner.setCity(partnerDto.getCity());
        partner.setAddress(partnerDto.getAddress());
        partner.setTaxCode(partnerDto.getTaxCode());
        partner.setStudentNamesJson(getStudentNamesJson(partnerDto.getStudentNames()));
        partner.setPrice(partnerDto.getPrice());
        partner.setIsActive(partnerDto.getIsActive());
        partnerRepository.save(partner);
    }

    public void updatePartner(String currentEmail, PartnerRequest partnerDto) {
        Partner existingPartner = partnerRepository.findByEmail(currentEmail).orElseThrow(() -> new PartnerNotFoundException(currentEmail));

        existingPartner.setName(partnerDto.getName());
        existingPartner.setEmail(partnerDto.getEmail());
        existingPartner.setPostalCode(partnerDto.getPostalCode());
        existingPartner.setCity(partnerDto.getCity());
        existingPartner.setAddress(partnerDto.getAddress());
        existingPartner.setTaxCode(partnerDto.getTaxCode());
        existingPartner.setStudentNamesJson(getStudentNamesJson(partnerDto.getStudentNames()));
        existingPartner.setPrice(partnerDto.getPrice());
        existingPartner.setIsActive(partnerDto.getIsActive());

        partnerRepository.save(existingPartner);
    }

    public List<PartnerRequest> getAllPartners() {
        return partnerRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public List<String> getAllPartnerEmails() {
        return partnerRepository.findAll().stream()
                .map(Partner::getEmail)
                .sorted()
                .collect(Collectors.toList());
    }

    private PartnerRequest convertToResponse(Partner partner) {
        PartnerRequest response = new PartnerRequest();
        response.setName(partner.getName());
        response.setEmail(partner.getEmail());
        response.setPostalCode(partner.getPostalCode());
        response.setCity(partner.getCity());
        response.setAddress(partner.getAddress());
        response.setTaxCode(partner.getTaxCode());
        response.setStudentNames(getStudentNamesList(partner.getStudentNamesJson()));
        response.setPrice(partner.getPrice());
        response.setIsActive(partner.getIsActive());
        return response;
    }

    private List<String> getStudentNamesList(String studentNamesJson) {
        try {
            return objectMapper.readValue(studentNamesJson,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (JsonProcessingException e) {
            throw new JsonConversionException(
                    "Hiba történt a JSON visszaalakítása során", e);
        }
    }

    private String getStudentNamesJson(List<String> studentNames) {
        try {
            return objectMapper.writeValueAsString(studentNames);
        } catch (JsonProcessingException e) {
            throw new JsonConversionException("Hiba történt a hallgatók neveinek JSON-ná alakítása során", e);
        }
    }
}
