import { parse } from 'csv-parse/sync';

/**
 * Import Service
 * Handles CSV import of participant data
 */

/**
 * Parse CSV file and extract participants
 * Expected format: Name,Role or Name,Role,Skills
 */
export const parseParticipantsCSV = (csvContent) => {
  try {
    const records = parse(csvContent, {
      columns: false,
      skip_empty_lines: true,
      trim: true
    });

    const participants = [];
    const errors = [];
    let hasHeader = false;

    // Check if first row is header
    if (records.length > 0) {
      const firstRow = records[0];
      if (
        firstRow[0]?.toLowerCase() === 'name' ||
        firstRow[0]?.toLowerCase() === 'participant'
      ) {
        hasHeader = true;
        records.shift(); // Remove header row
      }
    }

    records.forEach((row, index) => {
      const lineNumber = index + (hasHeader ? 2 : 1);

      if (row.length < 2) {
        errors.push(`Line ${lineNumber}: Missing required columns (Name, Role)`);
        return;
      }

      const name = row[0]?.trim();
      const role = row[1]?.trim();
      const skills = row[2]?.trim();

      if (!name) {
        errors.push(`Line ${lineNumber}: Name is required`);
        return;
      }

      if (!role) {
        errors.push(`Line ${lineNumber}: Role is required`);
        return;
      }

      // Check for duplicates within the CSV
      if (participants.some(p => p.name === name)) {
        errors.push(`Line ${lineNumber}: Duplicate participant "${name}"`);
        return;
      }

      const participant = { name, role };

      // Add skills if provided
      if (skills) {
        participant.skills = skills.split(';').map(s => s.trim()).filter(Boolean);
      }

      participants.push(participant);
    });

    return {
      success: errors.length === 0,
      participants,
      errors,
      count: participants.length
    };
  } catch (error) {
    return {
      success: false,
      participants: [],
      errors: [`CSV parsing error: ${error.message}`],
      count: 0
    };
  }
};

/**
 * Validate participants against existing project
 */
export const validateImportedParticipants = (importedParticipants, existingParticipants) => {
  const warnings = [];
  const duplicates = [];

  importedParticipants.forEach(imported => {
    const existing = existingParticipants.find(p => p.name === imported.name);
    if (existing) {
      duplicates.push(imported.name);
      warnings.push(`Participant "${imported.name}" already exists and will be skipped`);
    }
  });

  return {
    hasWarnings: warnings.length > 0,
    warnings,
    duplicates,
    uniqueParticipants: importedParticipants.filter(p => !duplicates.includes(p.name))
  };
};

/**
 * Generate sample CSV template
 */
export const generateSampleCSV = () => {
  return `Name,Role,Skills
Alice Johnson,Developer,JavaScript;React;Node.js
Bob Smith,Designer,UI/UX;Figma;Photoshop
Carol Williams,Product Manager,Agile;Scrum
David Brown,Data Scientist,Python;ML;Statistics
Eve Davis,Developer,Python;Django;PostgreSQL
Frank Miller,Designer,Branding;Illustration`;
};
