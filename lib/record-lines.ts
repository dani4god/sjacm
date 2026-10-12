import { fullName, type PublicProfile } from "./validation";
export function recordLines(p: PublicProfile) {
  const rows: [string, string][] = [
    ["Candidate name", fullName(p)],
    ["Surname", p.surname],
    ["First name", p.firstName],
    ["Church code", p.churchCode],
    ["Baptized", p.baptized ? "Yes" : "No"],
  ];
  if (p.baptized && p.baptism) {
    const b = p.baptism;
    rows.push(
      ["Date of baptism", b.date],
      ["Date of birth", b.dateOfBirth],
      ["Number in register", b.registerNumber],
      ["Page in register", b.registerPage],
      ["Parents or former religion", b.parentsOrFormerReligion],
      ["Sponsors", b.sponsors.join("; ")],
      ["Residence", b.residence],
      ["By whom baptized", b.priest],
    );
  }
  rows.push(["Confirmed", p.confirmed ? "Yes" : "No"]);
  if (p.confirmed && p.confirmation) {
    rows.push(
      ["Date of confirmation", p.confirmation.date],
      ["Where confirmed", p.confirmation.place],
      ["By whom confirmed", p.confirmation.priest],
    );
  }
  rows.push(["Membership of organizations", p.hasOrganizations ? "Yes" : "No"]);
  if (p.hasOrganizations)
    rows.push(["Organizations", p.organizations.join("; ")]);
  rows.push(["Wedded in the church", p.married ? "Yes" : "No"]);
  if (p.married && p.marriage)
    rows.push(
      ["To whom married", p.marriage.spouse],
      ["Date of wedding", p.marriage.date],
      ["Officiating priests", p.marriage.priests.join("; ")],
    );
  rows.push(["Churched", p.churched ? "Yes" : "No"]);
  if (p.churched && p.churching)
    rows.push(
      ["Date of churching", p.churching.date],
      ["Churching priest", p.churching.priest],
    );
  rows.push(
    ["Comment by priest", p.priestComment],
    ["Commenting priest", p.commentPriest],
    ["Record last checked", new Date(p.updatedAt).toISOString().slice(0, 10)],
  );
  return rows;
}
