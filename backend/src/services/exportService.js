import { stringify } from 'csv-stringify/sync';
import PDFDocument from 'pdfkit';

/**
 * Export Service
 * Handles CSV and PDF export of team data
 */

/**
 * Generate CSV content for teams
 */
export const generateTeamsCSV = (project) => {
  const records = [];

  // Add header with project info
  records.push(['Project Name', project.projectName]);
  records.push(['Team Size', project.teamSize]);
  records.push(['Number of Teams', project.numberOfTeams]);
  records.push(['Optimization Score', project.optimizationScore.toFixed(2)]);
  records.push(['Generated At', new Date().toISOString()]);
  records.push([]); // Empty row

  // Add teams data
  if (project.generatedTeams && project.generatedTeams.length > 0) {
    for (const team of project.generatedTeams) {
      records.push([team.teamName || `Team ${team.teamNumber}`, '', '']);
      records.push(['Member Name', 'Role', '']);

      for (const member of team.members) {
        records.push([member.name, member.role, '']);
      }

      records.push([]); // Empty row between teams
    }
  } else {
    records.push(['No teams generated yet']);
  }

  return stringify(records);
};

/**
 * Generate CSV content for participants
 */
export const generateParticipantsCSV = (project) => {
  const records = [];

  // Add header
  records.push(['Name', 'Role', 'Assigned Team']);

  // Add participants
  for (const participant of project.participants) {
    const assignedTeam = project.generatedTeams?.find(team =>
      team.members.some(m => m.name === participant.name)
    );

    records.push([
      participant.name,
      participant.role,
      assignedTeam ? assignedTeam.teamName || `Team ${assignedTeam.teamNumber}` : 'Unassigned'
    ]);
  }

  return stringify(records);
};

/**
 * Generate PDF document for teams
 */
export const generateTeamsPDF = (project) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .text(project.projectName, { align: 'center' });

      doc.moveDown();

      // Project Info
      doc.fontSize(12)
        .font('Helvetica')
        .text(`Team Size: ${project.teamSize}`, { continued: true })
        .text(`    Number of Teams: ${project.numberOfTeams}`);

      doc.text(`Optimization Score: ${project.optimizationScore.toFixed(2)}`, { continued: true })
        .text(`    Generated: ${new Date().toLocaleDateString()}`);

      doc.moveDown(2);

      // Teams
      if (project.generatedTeams && project.generatedTeams.length > 0) {
        for (const team of project.generatedTeams) {
          // Team header
          doc.fontSize(16)
            .font('Helvetica-Bold')
            .fillColor('#4F46E5')
            .text(team.teamName || `Team ${team.teamNumber}`);

          doc.moveDown(0.5);

          // Team members
          doc.fontSize(11)
            .font('Helvetica')
            .fillColor('#000000');

          for (const member of team.members) {
            doc.text(`• ${member.name}`, { continued: true, indent: 20 })
              .fillColor('#6B7280')
              .text(` - ${member.role}`)
              .fillColor('#000000');
          }

          doc.moveDown(1.5);

          // Add page break if needed
          if (doc.y > 650) {
            doc.addPage();
          }
        }
      } else {
        doc.fontSize(12)
          .fillColor('#6B7280')
          .text('No teams generated yet', { align: 'center' });
      }

      // Footer
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(10)
          .fillColor('#9CA3AF')
          .text(
            `Page ${i + 1} of ${pages.count}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate team statistics
 */
export const generateTeamStats = (project) => {
  const stats = {
    totalParticipants: project.participants.length,
    totalTeams: project.numberOfTeams,
    teamSize: project.teamSize,
    optimizationScore: project.optimizationScore,
    isOptimized: project.isOptimized,
    roleDistribution: {},
    teamStats: [],
    constraints: {
      total: project.constraints.length,
      byType: {}
    }
  };

  // Calculate role distribution
  project.participants.forEach(p => {
    stats.roleDistribution[p.role] = (stats.roleDistribution[p.role] || 0) + 1;
  });

  // Constraint statistics
  project.constraints.forEach(c => {
    stats.constraints.byType[c.type] = (stats.constraints.byType[c.type] || 0) + 1;
  });

  // Team-specific stats
  if (project.generatedTeams && project.generatedTeams.length > 0) {
    project.generatedTeams.forEach(team => {
      const teamRoles = {};
      team.members.forEach(m => {
        teamRoles[m.role] = (teamRoles[m.role] || 0) + 1;
      });

      stats.teamStats.push({
        teamNumber: team.teamNumber,
        teamName: team.teamName || `Team ${team.teamNumber}`,
        memberCount: team.members.length,
        roles: teamRoles,
        roleDiversity: Object.keys(teamRoles).length
      });
    });

    // Calculate average team size
    const teamSizes = stats.teamStats.map(t => t.memberCount);
    stats.averageTeamSize = teamSizes.reduce((a, b) => a + b, 0) / teamSizes.length;
    stats.minTeamSize = Math.min(...teamSizes);
    stats.maxTeamSize = Math.max(...teamSizes);
  }

  return stats;
};
