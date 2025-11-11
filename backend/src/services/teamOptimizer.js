/**
 * Team Optimizer Service
 * Handles the optimization of team assignments based on constraints and randomness
 */

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Converts roleRequirements to a plain object for consistency
 */
const toPlainRoleRequirements = (rr) => {
  if (!rr) return {};
  if (rr instanceof Map) return Object.fromEntries(rr.entries());
  // Mongoose Map exposes .get etc; convert if needed
  if (typeof rr === 'object' && rr !== null && rr.$__map) return Object.fromEntries(rr);
  return { ...rr };
};

/**
 * Calculates a score for a team configuration based on constraints
 */
const calculateScore = (teams, constraints) => {
  let score = 100;
  let violations = 0;

  for (const constraint of constraints) {
    if (constraint.type === 'cannot_be_together') {
      // Check if any of the constrained participants are on the same team
      for (const team of teams) {
        const teamMemberNames = team.members.map(m => m.name);
        const constraintParticipants = constraint.participants;
        const foundInTeam = constraintParticipants.filter(p => teamMemberNames.includes(p));

        if (foundInTeam.length > 1) {
          violations++;
          score -= 20; // Heavy penalty for violating cannot_be_together
        }
      }
    } else if (constraint.type === 'must_be_together') {
      // Check if constrained participants are all on the same team
      let foundTogether = false;
      for (const team of teams) {
        const teamMemberNames = team.members.map(m => m.name);
        const constraintParticipants = constraint.participants;
        const foundInTeam = constraintParticipants.filter(p => teamMemberNames.includes(p));

        if (foundInTeam.length === constraintParticipants.length) {
          foundTogether = true;
          break;
        }
      }
      if (!foundTogether) {
        violations++;
        score -= 15; // Penalty for not satisfying must_be_together
      }
    } else if (constraint.type === 'role_distribution') {
      const roleRequirements = toPlainRoleRequirements(constraint.roleRequirements);

      // Check if each team meets the role requirements
      for (const team of teams) {
        const roleCount = {};
        team.members.forEach(member => {
          roleCount[member.role] = (roleCount[member.role] || 0) + 1;
        });

        // Check each required role
        for (const [role, requiredCount] of Object.entries(roleRequirements)) {
          const actualCount = roleCount[role] || 0;
          if (actualCount !== requiredCount) {
            violations++;
            score -= 18; // Heavy penalty for role distribution violation
          }
        }
      }
    }
  }

  // Check for balanced team sizes
  const teamSizes = teams.map(t => t.members.length);
  const maxSize = Math.max(...teamSizes);
  const minSize = Math.min(...teamSizes);
  const sizeImbalance = maxSize - minSize;

  if (sizeImbalance > 1) {
    score -= sizeImbalance * 5; // Penalty for unbalanced teams
  }

  // Check for role distribution (general diversity bonus)
  for (const team of teams) {
    const roles = team.members.map(m => m.role);
    const uniqueRoles = new Set(roles);
    const roleDiversity = uniqueRoles.size / roles.length;

    // Reward teams with diverse roles
    score += roleDiversity * 5;
  }

  return { score: Math.max(0, score), violations };
};

/**
 * Generates teams with a mix of optimization and randomness
 */
const generateTeams = (participants, teamSize, constraints, randomnessFactor) => {
  const numTeams = Math.ceil(participants.length / teamSize);
  const teams = Array.from({ length: numTeams }, (_, i) => ({
    teamNumber: i + 1,
    teamName: `Team ${i + 1}`,
    members: []
  }));

  // Apply randomness factor - shuffle participants based on randomness percentage
  let workingParticipants = [...participants];

  if (randomnessFactor > 0) {
    const randomnessRatio = randomnessFactor / 100;
    const numToRandomize = Math.floor(participants.length * randomnessRatio);

    // Shuffle the first portion based on randomness factor
    const toRandomize = workingParticipants.slice(0, numToRandomize);
    const notRandomized = workingParticipants.slice(numToRandomize);
    workingParticipants = [...shuffleArray(toRandomize), ...notRandomized];
  }

  // Handle must_be_together constraints first
  const mustBeTogetherConstraints = constraints.filter(c => c.type === 'must_be_together');
  const assignedParticipants = new Set();

  for (const constraint of mustBeTogetherConstraints) {
    const participantsToGroup = workingParticipants.filter(p =>
      constraint.participants.includes(p.name) && !assignedParticipants.has(p.name)
    );

    if (participantsToGroup.length > 0) {
      // Find team with most space
      const sortedTeams = [...teams].sort((a, b) => a.members.length - b.members.length);
      const targetTeam = sortedTeams[0];

      participantsToGroup.forEach(p => {
        targetTeam.members.push({ name: p.name, role: p.role });
        assignedParticipants.add(p.name);
      });
    }
  }

  // Assign remaining participants
  const remainingParticipants = workingParticipants.filter(p => !assignedParticipants.has(p.name));
  const cannotBeTogetherConstraints = constraints.filter(c => c.type === 'cannot_be_together');
  const roleDistributionConstraints = constraints
    .filter(c => c.type === 'role_distribution')
    .map(c => ({ ...c, roleRequirements: toPlainRoleRequirements(c.roleRequirements) }));

  for (const participant of remainingParticipants) {
    let bestTeam = null;
    let bestScore = -Infinity;

    for (const team of teams) {
      // Check if team is full
      if (team.members.length >= teamSize) continue;

      // Check cannot_be_together constraints
      const teamMemberNames = team.members.map(m => m.name);
      let violatesConstraint = false;

      for (const constraint of cannotBeTogetherConstraints) {
        if (constraint.participants.includes(participant.name)) {
          const otherConstrainedMembers = constraint.participants.filter(p => p !== participant.name);
          if (otherConstrainedMembers.some(p => teamMemberNames.includes(p))) {
            violatesConstraint = true;
            break;
          }
        }
      }

      if (violatesConstraint) continue;

      // Calculate score for adding this participant to this team
      let teamScore = 0;

      // Prefer smaller teams (balance)
      teamScore += (numTeams * teamSize - team.members.length) * 2;

      // Check role distribution constraints
      if (roleDistributionConstraints.length > 0) {
        for (const constraint of roleDistributionConstraints) {
          const roleRequirements = constraint.roleRequirements || {};
          const roleCount = {};
          team.members.forEach(m => {
            roleCount[m.role] = (roleCount[m.role] || 0) + 1;
          });

          // If this role is required and we haven't reached the requirement
          const required = roleRequirements[participant.role] || 0;
          const current = roleCount[participant.role] || 0;
          if (required > 0 && current < required) {
            teamScore += 20; // High priority for filling role requirements
          } else if (required > 0 && current >= required) {
            teamScore -= 30; // Penalty for exceeding role requirements
          }
        }
      } else {
        // Prefer role diversity if no role distribution constraints
        const teamRoles = team.members.map(m => m.role);
        if (!teamRoles.includes(participant.role)) {
          teamScore += 10;
        }
      }

      if (teamScore > bestScore) {
        bestScore = teamScore;
        bestTeam = team;
      }
    }

    // If no suitable team found (shouldn't happen), add to smallest team
    if (!bestTeam) {
      bestTeam = [...teams].sort((a, b) => a.members.length - b.members.length)[0];
    }

    bestTeam.members.push({ name: participant.name, role: participant.role });
  }

  return teams.filter(t => t.members.length > 0);
};

/**
 * Main optimization function
 * Generates multiple configurations and returns the best one
 */
export const optimizeTeams = (participants, teamSize, constraints = [], randomnessFactor = 30) => {
  const iterations = randomnessFactor > 50 ? 10 : randomnessFactor > 20 ? 50 : 100;
  let bestTeams = null;
  let bestScore = -Infinity;
  let bestViolations = Infinity;

  for (let i = 0; i < iterations; i++) {
    const teams = generateTeams(participants, teamSize, constraints, randomnessFactor);
    const { score, violations } = calculateScore(teams, constraints);

    // Prioritize fewer violations, then higher score
    if (violations < bestViolations || (violations === bestViolations && score > bestScore)) {
      bestViolations = violations;
      bestScore = score;
      bestTeams = teams;
    }
  }

  return {
    teams: bestTeams,
    score: bestScore,
    violations: bestViolations,
    constraintsSatisfied: bestViolations === 0
  };
};

/**
 * Validates constraints before optimization
 */
export const validateConstraints = (participants, constraints, teamSize) => {
  const errors = [];
  const participantNames = participants.map(p => p.name);
  const numTeams = Math.ceil(participants.length / teamSize);

  for (const constraint of constraints) {
    if (constraint.type === 'role_distribution') {
      const roleRequirements = toPlainRoleRequirements(constraint.roleRequirements);

      // Count available participants by role
      const availableRoles = {};
      participants.forEach(p => {
        availableRoles[p.role] = (availableRoles[p.role] || 0) + 1;
      });

      // Calculate total needed for each role
      let totalRequiredPeople = 0;
      for (const [role, count] of Object.entries(roleRequirements)) {
        const totalNeeded = count * numTeams;
        const available = availableRoles[role] || 0;

        totalRequiredPeople += totalNeeded;

        if (available < totalNeeded) {
          errors.push(`Role distribution requires ${totalNeeded} "${role}" (${count} per team × ${numTeams} teams), but only ${available} available`);
        } else if (available > totalNeeded) {
          console.warn(`Warning: ${available - totalNeeded} extra "${role}" participants will not match the exact distribution`);
        }
      }
      const requiredPerTeam = Object.values(roleRequirements).reduce((sum, count) => sum + count, 0);
      if (requiredPerTeam !== teamSize) {
        errors.push(`Role distribution requires ${requiredPerTeam} members per team, but team size is ${teamSize}`);
      }
    } else {
      // Check if all participants in constraint exist
      if (constraint.participants) {
        for (const participantName of constraint.participants) {
          if (!participantNames.includes(participantName)) {
            errors.push(`Participant "${participantName}" in constraint not found`);
          }
        }
      }

      // Check if must_be_together constraint has too many members for team size
      if (constraint.type === 'must_be_together' && constraint.participants.length > teamSize) {
        errors.push(`"Must be together" constraint has more participants (${constraint.participants.length}) than team size (${teamSize})`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
};
