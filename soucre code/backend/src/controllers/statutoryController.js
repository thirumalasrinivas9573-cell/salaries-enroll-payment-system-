const { StatutoryRule, Company, AuditLog } = require('../models');

async function getStatutoryRules(req, res) {
  try {
    let rules = await StatutoryRule.findOne().sort({ createdAt: -1 });
    if (!rules) {
      rules = await StatutoryRule.create({
        version: 'v2026.1',
        pf_wage_ceiling: 15000.0,
        esic_wage_ceiling: 21000.0,
        restrict_pf_ceiling: true,
        verified: true,
        verified_by: 'Statutory Compliance Committee'
      });
    }
    res.json({ success: true, data: rules.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function updateStatutoryRules(req, res) {
  try {
    const {
      version,
      pf_wage_ceiling,
      esic_wage_ceiling,
      pf_employee_rate,
      pf_employer_rate,
      eps_rate,
      edli_rate,
      admin_rate,
      esic_employee_rate,
      esic_employer_rate,
      restrict_pf_ceiling,
      verified,
      verified_by,
      notes
    } = req.body;

    let rules = await StatutoryRule.findOne().sort({ createdAt: -1 });
    if (!rules) {
      rules = new StatutoryRule();
    }

    if (version !== undefined) rules.version = version;
    if (pf_wage_ceiling !== undefined) rules.pf_wage_ceiling = Number(pf_wage_ceiling);
    if (esic_wage_ceiling !== undefined) rules.esic_wage_ceiling = Number(esic_wage_ceiling);
    if (pf_employee_rate !== undefined) rules.pf_employee_rate = Number(pf_employee_rate);
    if (pf_employer_rate !== undefined) rules.pf_employer_rate = Number(pf_employer_rate);
    if (eps_rate !== undefined) rules.eps_rate = Number(eps_rate);
    if (edli_rate !== undefined) rules.edli_rate = Number(edli_rate);
    if (admin_rate !== undefined) rules.admin_rate = Number(admin_rate);
    if (esic_employee_rate !== undefined) rules.esic_employee_rate = Number(esic_employee_rate);
    if (esic_employer_rate !== undefined) rules.esic_employer_rate = Number(esic_employer_rate);
    if (restrict_pf_ceiling !== undefined) rules.restrict_pf_ceiling = Boolean(restrict_pf_ceiling);
    if (verified !== undefined) rules.verified = Boolean(verified);
    if (verified_by !== undefined) rules.verified_by = verified_by;
    if (notes !== undefined) rules.notes = notes;
    rules.verified_at = new Date();

    await rules.save();

    await AuditLog.create({
      action: 'STATUTORY_RULES_UPDATE',
      entity: 'StatutoryRule',
      entity_id: rules._id.toString(),
      user_name: req.user?.name || 'Administrator',
      details: { version: rules.version, pfCeiling: rules.pf_wage_ceiling, esicCeiling: rules.esic_wage_ceiling }
    }).catch(() => {});

    res.json({
      success: true,
      message: `Statutory compliance rules updated (${rules.version}).`,
      data: rules.toJSON()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getCompanyProfile(req, res) {
  try {
    let company = await Company.findOne();
    if (!company) {
      company = await Company.create({
        name: 'Apex Industrial Technologies Pvt Ltd',
        registration_number: 'U29100DL2018PTC334512',
        address: 'Plot 42, Sector 8, Industrial Area, Phase II, New Delhi 110020',
        pf_code: 'DL/CPM/0012345/000',
        esic_code: '11000123450000101',
        pan: 'AABCA1234C',
        signatory_name: 'Vikram Singhania',
        signatory_designation: 'Director & Authorized Signatory'
      });
    }
    res.json({ success: true, data: company.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function updateCompanyProfile(req, res) {
  try {
    let company = await Company.findOne();
    if (!company) {
      company = new Company();
    }

    const fields = [
      'name', 'registration_number', 'address', 'pf_code', 'esic_code',
      'pan', 'tan', 'signatory_name', 'signatory_designation'
    ];

    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        company[f] = req.body[f];
      }
    });

    await company.save();

    await AuditLog.create({
      action: 'COMPANY_PROFILE_UPDATE',
      entity: 'Company',
      entity_id: company._id.toString(),
      user_name: req.user?.name || 'Administrator',
      details: { name: company.name }
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Company profile and statutory registration details updated.',
      data: company.toJSON()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getStatutoryRules,
  updateStatutoryRules,
  getCompanyProfile,
  updateCompanyProfile
};
