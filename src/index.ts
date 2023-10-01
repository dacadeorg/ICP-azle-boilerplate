class Candidate {
  constructor(public name: string) {
    this.votes = 0;
  }
  votes: number;
}

class ElectionSystem {
  private candidates: Candidate[] = [];

  addCandidate(candidateName: string) {
    this.candidates.push(new Candidate(candidateName));
  }

  castVote(candidateName: string) {
    const candidate = this.candidates.find((c) => c.name === candidateName);
    if (candidate) {
      candidate.votes++;
      return true; // Vote cast successfully
    }
    return false; // Candidate not found
  }

  countVotes() {
    const sortedCandidates = this.candidates.sort((a, b) => b.votes - a.votes);
    return sortedCandidates;
  }
}

// Example usage:
const election = new ElectionSystem();
election.addCandidate("Candidate A");
election.addCandidate("Candidate B");

election.castVote("Candidate A");
election.castVote("Candidate A");
election.castVote("Candidate B");

const results = election.countVotes();
console.log("Election Results:");
results.forEach((candidate, index) => {
  console.log(`${index + 1}. ${candidate.name}: ${candidate.votes} votes`);
});
