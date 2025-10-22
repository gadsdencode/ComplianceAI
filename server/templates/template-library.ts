// Comprehensive Document Template Library with Professional Content
export interface DocumentTemplate {
  name: string;
  category: string;
  description: string;
  content: string;
  tags: string[];
  variables?: string[];
  estimatedTime?: string;
  complianceStandards?: string[];
  isDefault?: boolean;
}

export const documentTemplates: DocumentTemplate[] = [
  // Privacy & Data Protection Templates
  {
    name: "GDPR Privacy Policy",
    category: "Privacy",
    description: "Comprehensive GDPR-compliant privacy policy for businesses operating in the EU",
    tags: ["GDPR", "Privacy", "EU", "Data Protection"],
    variables: ["Company Name", "Company Address", "Data Protection Officer Email", "Company Website"],
    estimatedTime: "15-20 minutes",
    complianceStandards: ["GDPR", "EU Data Protection"],
    isDefault: true,
    content: `# PRIVACY POLICY

**Last Updated:** [DATE]

## 1. INTRODUCTION

[Company Name] ("we," "us," or "our") is committed to protecting the privacy and security of your personal information. This Privacy Policy describes how we collect, use, disclose, and safeguard your personal data in accordance with the General Data Protection Regulation (GDPR) (EU) 2016/679 and other applicable data protection laws.

This policy applies to all personal data we process, including data collected through:
- Our website: [Company Website]
- Our mobile applications
- Our products and services
- Communications with us
- Third-party sources

## 2. DATA CONTROLLER INFORMATION

**Data Controller:** [Company Name]
**Registered Address:** [Company Address]
**Contact Email:** privacy@[Company Domain]
**Data Protection Officer:** [Data Protection Officer Email]
**Company Registration Number:** [Registration Number]

## 3. TYPES OF PERSONAL DATA WE COLLECT

### 3.1 Information You Provide Directly

**Identity Data:**
- First name, last name, username or similar identifier
- Marital status, title, date of birth, and gender
- Government-issued identification numbers (where legally required)

**Contact Data:**
- Billing address, delivery address, email address, and telephone numbers
- Emergency contact information

**Financial Data:**
- Bank account details, payment card details
- Transaction history and payment records

**Transaction Data:**
- Details about payments to and from you
- Details of products and services you have purchased from us

**Technical Data:**
- Internet protocol (IP) address, login data
- Browser type and version, time zone setting and location
- Browser plug-in types and versions
- Operating system and platform
- Other technology on devices used to access our services

**Profile Data:**
- Username and password, purchases or orders made by you
- Interests, preferences, feedback, and survey responses

**Usage Data:**
- Information about how you use our website, products, and services
- Marketing and communications preferences

### 3.2 Information We Collect Automatically

When you interact with our services, we automatically collect:
- Device information and identifiers
- Log files and usage data
- Location data (with consent)
- Cookie data and similar tracking technologies

### 3.3 Information from Third Parties

We may receive personal data about you from:
- Public databases and registries
- Credit reference agencies
- Marketing partners and analytics providers
- Social media platforms
- Business partners and affiliates

## 4. LEGAL BASIS FOR PROCESSING

We process your personal data under the following legal bases:

**Consent (Article 6(1)(a) GDPR):**
- Marketing communications
- Non-essential cookies and tracking
- Optional service features

**Contract Performance (Article 6(1)(b) GDPR):**
- Account creation and management
- Order processing and delivery
- Customer service and support
- Billing and payment processing

**Legal Obligations (Article 6(1)(c) GDPR):**
- Tax and accounting requirements
- Fraud prevention and security
- Regulatory compliance

**Legitimate Interests (Article 6(1)(f) GDPR):**
- Improving our products and services
- Network and information security
- Direct marketing (where consent not required)
- Internal administration and record-keeping

## 5. HOW WE USE YOUR PERSONAL DATA

We use your personal data for the following purposes:

### 5.1 Service Provision
- Process and fulfill orders
- Manage your account and relationship with us
- Provide customer support
- Communicate important service updates

### 5.2 Legal and Compliance
- Comply with legal obligations
- Establish, exercise, or defend legal claims
- Prevent fraud and enhance security
- Conduct audits and assessments

### 5.3 Business Operations
- Analyze usage patterns and improve services
- Develop new products and features
- Conduct market research
- Manage business risks

### 5.4 Marketing and Communications
- Send promotional materials (with consent)
- Personalize your experience
- Conduct surveys and gather feedback
- Manage marketing preferences

## 6. DATA SHARING AND DISCLOSURE

We may share your personal data with:

### 6.1 Service Providers
Third-party vendors who provide services such as:
- Payment processing
- Cloud storage and hosting
- Analytics and performance monitoring
- Marketing and advertising
- Customer relationship management

### 6.2 Business Partners
- Strategic partners for joint offerings
- Authorized resellers and distributors
- Professional advisors (lawyers, accountants, auditors)

### 6.3 Legal and Regulatory Authorities
When required by law or to:
- Respond to legal process or government requests
- Enforce our terms and conditions
- Protect rights, privacy, safety, or property
- Investigate potential violations

### 6.4 Business Transfers
In connection with:
- Mergers, acquisitions, or asset sales
- Corporate restructuring or dissolution
- Bankruptcy proceedings

## 7. INTERNATIONAL DATA TRANSFERS

Your personal data may be transferred to and processed in countries outside the European Economic Area (EEA). We ensure appropriate safeguards through:

- **Standard Contractual Clauses (SCCs):** EU Commission-approved contracts
- **Adequacy Decisions:** Transfers to countries deemed adequate by the EU
- **Binding Corporate Rules (BCRs):** For intra-group transfers
- **Your Explicit Consent:** Where other safeguards are not available

## 8. DATA RETENTION

We retain personal data for as long as necessary to:
- Provide requested services
- Comply with legal obligations
- Resolve disputes and enforce agreements
- Support business operations

Specific retention periods:
- **Account Data:** Duration of account plus 7 years
- **Transaction Records:** 7 years for tax purposes
- **Marketing Data:** Until consent withdrawn or 3 years of inactivity
- **Cookie Data:** As specified in our Cookie Policy
- **Security Logs:** 12 months

## 9. YOUR RIGHTS UNDER GDPR

You have the following rights regarding your personal data:

### 9.1 Right to Access (Article 15)
Request a copy of your personal data and information about how we process it.

### 9.2 Right to Rectification (Article 16)
Request correction of inaccurate or incomplete personal data.

### 9.3 Right to Erasure (Article 17)
Request deletion of your personal data ("right to be forgotten").

### 9.4 Right to Restriction (Article 18)
Request limitation of processing your personal data.

### 9.5 Right to Data Portability (Article 20)
Receive your data in a structured, machine-readable format.

### 9.6 Right to Object (Article 21)
Object to processing based on legitimate interests or direct marketing.

### 9.7 Rights Related to Automated Decision-Making (Article 22)
Not be subject to decisions based solely on automated processing.

### 9.8 Right to Withdraw Consent
Withdraw consent at any time where processing is based on consent.

## 10. EXERCISING YOUR RIGHTS

To exercise your rights, please contact us at:
- **Email:** privacy@[Company Domain]
- **Mail:** [Company Address]
- **Phone:** [Company Phone]

We will respond within one month, extendable by two months for complex requests.

## 11. DATA SECURITY

We implement appropriate technical and organizational measures to protect personal data:

### 11.1 Technical Measures
- Encryption of data in transit and at rest
- Regular security assessments and penetration testing
- Access controls and authentication mechanisms
- Network security and firewalls
- Intrusion detection and prevention systems

### 11.2 Organizational Measures
- Data protection training for employees
- Confidentiality agreements
- Limited access on need-to-know basis
- Regular security audits
- Incident response procedures

## 12. DATA BREACH NOTIFICATION

In the event of a personal data breach, we will:
- Notify the relevant supervisory authority within 72 hours
- Inform affected individuals if the breach poses high risk to rights and freedoms
- Document all breaches and remedial actions taken
- Implement measures to prevent future breaches

## 13. CHILDREN'S PRIVACY

Our services are not directed to individuals under 16 years of age. We do not knowingly collect personal data from children. If we become aware of such collection, we will delete the data immediately.

## 14. COOKIES AND TRACKING TECHNOLOGIES

We use cookies and similar technologies for:
- Essential website functionality
- Performance and analytics
- Personalization and advertising
- Social media integration

For detailed information, please see our Cookie Policy at [Cookie Policy URL].

## 15. THIRD-PARTY LINKS

Our services may contain links to third-party websites. We are not responsible for their privacy practices. Please review their privacy policies before providing personal data.

## 16. CHANGES TO THIS POLICY

We may update this Privacy Policy periodically. Changes will be posted on this page with an updated revision date. Material changes will be notified via email or prominent notice on our services.

## 17. COMPLAINTS

If you have concerns about our data processing, you have the right to lodge a complaint with:

**Our Data Protection Officer:**
Email: [Data Protection Officer Email]

**Your Local Supervisory Authority:**
You can find your local authority at: https://edpb.europa.eu/about-edpb/board/members_en

## 18. CONTACT INFORMATION

For questions or concerns about this Privacy Policy or our data practices:

**[Company Name]**
Attention: Data Protection Officer
[Company Address]
Email: privacy@[Company Domain]
Phone: [Company Phone]

---

*This Privacy Policy was last updated on [DATE] and is effective as of that date.*`
  },
  
  {
    name: "ISO 27001 Information Security Policy",
    category: "Security",
    description: "Complete ISO 27001 compliant information security policy",
    tags: ["ISO 27001", "Security", "InfoSec", "Policy"],
    variables: ["Company Name", "CISO Name", "Review Date"],
    estimatedTime: "20-25 minutes",
    complianceStandards: ["ISO 27001", "ISO 27002"],
    isDefault: true,
    content: `# INFORMATION SECURITY POLICY

**Document Version:** 2.0
**Effective Date:** [DATE]
**Next Review Date:** [REVIEW DATE]
**Classification:** Internal Use
**Owner:** Chief Information Security Officer
**Approved By:** [CISO Name]

## 1. PURPOSE AND SCOPE

### 1.1 Purpose

This Information Security Policy establishes the framework for protecting [Company Name]'s information assets and technology resources. It ensures the confidentiality, integrity, and availability of information while supporting business objectives and regulatory compliance with ISO 27001:2022 standards.

### 1.2 Scope

This policy applies to:
- All employees, contractors, consultants, and third-party users
- All information assets, regardless of form or format
- All IT systems, networks, and infrastructure
- All locations where company information is stored, processed, or transmitted
- All business processes that handle company information

### 1.3 Objectives

- Protect information from unauthorized access, disclosure, modification, or destruction
- Ensure business continuity and minimize business damage
- Meet legal, regulatory, and contractual requirements
- Establish a culture of security awareness
- Maintain stakeholder confidence and trust

## 2. POLICY STATEMENT

[Company Name] is committed to:
- Implementing and maintaining an Information Security Management System (ISMS) in accordance with ISO 27001:2022
- Protecting information assets against threats, whether internal, external, deliberate, or accidental
- Ensuring information security is embedded in all business processes
- Providing appropriate training and awareness programs
- Continually improving information security practices

## 3. INFORMATION SECURITY PRINCIPLES

### 3.1 Confidentiality
Information shall be accessible only to authorized individuals and protected from unauthorized disclosure.

### 3.2 Integrity
Information shall be accurate, complete, and protected from unauthorized modification.

### 3.3 Availability
Information and systems shall be available to authorized users when required.

### 3.4 Risk-Based Approach
Security measures shall be proportionate to the value of assets and associated risks.

### 3.5 Defense in Depth
Multiple layers of security controls shall be implemented to protect critical assets.

## 4. ROLES AND RESPONSIBILITIES

### 4.1 Board of Directors
- Approve information security strategy and policies
- Ensure adequate resources for information security
- Review security performance and incidents

### 4.2 Chief Information Security Officer (CISO)
- Develop and maintain the ISMS
- Coordinate security activities across the organization
- Report on security status to executive management
- Manage security incident response
- Ensure compliance with policies and regulations

### 4.3 Information Asset Owners
- Classify information assets according to sensitivity
- Define access requirements and controls
- Ensure appropriate protection measures
- Review access rights periodically

### 4.4 IT Department
- Implement technical security controls
- Monitor systems for security events
- Maintain security tools and infrastructure
- Support incident response activities
- Ensure secure system configuration

### 4.5 Human Resources
- Conduct background checks for sensitive positions
- Include security requirements in employment contracts
- Manage security aspects of onboarding and offboarding
- Coordinate security awareness training

### 4.6 All Employees
- Comply with security policies and procedures
- Protect company information and assets
- Report security incidents and vulnerabilities
- Complete required security training
- Use resources responsibly

## 5. INFORMATION CLASSIFICATION

### 5.1 Classification Levels

**PUBLIC**
- Information intended for public disclosure
- No confidentiality requirements
- Examples: Marketing materials, public website content

**INTERNAL USE**
- Information for internal business use
- Moderate sensitivity
- Examples: Internal policies, procedures, general correspondence

**CONFIDENTIAL**
- Sensitive business information
- Unauthorized disclosure could harm business interests
- Examples: Financial data, strategic plans, customer information

**RESTRICTED**
- Highly sensitive information
- Unauthorized disclosure could cause severe damage
- Examples: Trade secrets, personal data, security credentials

### 5.2 Handling Requirements

Each classification level requires specific handling controls:
- Labeling and marking requirements
- Storage and transmission controls
- Access restrictions
- Retention and disposal methods

## 6. ACCESS CONTROL

### 6.1 User Access Management
- Formal user registration and de-registration procedures
- Unique user IDs for accountability
- Role-based access control (RBAC)
- Segregation of duties for critical functions
- Regular access reviews and recertification

### 6.2 Authentication Requirements
- Strong password policy (minimum 12 characters, complexity requirements)
- Multi-factor authentication for sensitive systems
- Session timeout controls
- Account lockout after failed login attempts

### 6.3 Privileged Access Management
- Restricted administrative access
- Separate accounts for administrative tasks
- Logging and monitoring of privileged activities
- Regular review of privileged accounts

## 7. PHYSICAL AND ENVIRONMENTAL SECURITY

### 7.1 Physical Access Controls
- Secure perimeters with controlled entry points
- Access badges and visitor management
- Security guards and CCTV monitoring
- Secure areas for sensitive operations

### 7.2 Equipment Security
- Asset inventory and tracking
- Secure disposal of equipment and media
- Clear desk and clear screen policies
- Protection against environmental threats

### 7.3 Mobile Device Security
- Mobile device management (MDM) solutions
- Encryption of mobile devices
- Remote wipe capabilities
- Acceptable use guidelines

## 8. OPERATIONS SECURITY

### 8.1 Network Security
- Firewall protection and network segmentation
- Intrusion detection and prevention systems
- Secure remote access (VPN)
- Network monitoring and logging
- Regular vulnerability assessments

### 8.2 System Security
- Secure configuration standards
- Patch management procedures
- Anti-malware protection
- System hardening guidelines
- Change management controls

### 8.3 Data Protection
- Encryption for data at rest and in transit
- Data loss prevention (DLP) controls
- Backup and recovery procedures
- Secure data disposal
- Database security measures

## 9. INCIDENT MANAGEMENT

### 9.1 Incident Response Process
1. **Detection and Analysis**
   - Identify and validate incidents
   - Assess impact and severity
   - Document initial findings

2. **Containment and Eradication**
   - Isolate affected systems
   - Remove threats and vulnerabilities
   - Preserve evidence

3. **Recovery and Restoration**
   - Restore systems and data
   - Verify normal operations
   - Monitor for recurrence

4. **Post-Incident Review**
   - Conduct root cause analysis
   - Document lessons learned
   - Update controls and procedures

### 9.2 Incident Reporting
- Report incidents immediately to the Security Operations Center
- Contact: security@[Company Domain] or [Security Hotline]
- Provide detailed information about the incident
- Do not attempt to resolve incidents independently

## 10. BUSINESS CONTINUITY

### 10.1 Business Continuity Planning
- Business impact analysis (BIA)
- Recovery time objectives (RTO) and recovery point objectives (RPO)
- Continuity strategies and procedures
- Crisis management and communication plans

### 10.2 Disaster Recovery
- Data backup and restoration procedures
- Alternate processing facilities
- Emergency response procedures
- Regular testing and exercises

## 11. COMPLIANCE AND AUDIT

### 11.1 Regulatory Compliance
- Identify applicable laws and regulations
- Implement required controls
- Maintain compliance documentation
- Report to regulatory bodies as required

### 11.2 Internal Audits
- Annual ISMS audits
- Compliance assessments
- Technical security reviews
- Corrective action tracking

### 11.3 External Audits
- ISO 27001 certification audits
- Third-party security assessments
- Penetration testing
- Vulnerability assessments

## 12. SECURITY AWARENESS AND TRAINING

### 12.1 Training Program
- Security awareness for all employees
- Role-specific security training
- Regular security updates and reminders
- Phishing simulation exercises

### 12.2 Security Culture
- Security champions program
- Security metrics and reporting
- Recognition for security achievements
- Open communication channels

## 13. SUPPLIER RELATIONSHIPS

### 13.1 Third-Party Security
- Security requirements in contracts
- Vendor risk assessments
- Ongoing monitoring of suppliers
- Right to audit clauses

### 13.2 Cloud Security
- Cloud service provider evaluation
- Data residency requirements
- Shared responsibility model
- Cloud security controls

## 14. CRYPTOGRAPHY

### 14.1 Cryptographic Controls
- Use of approved algorithms and key lengths
- Key management procedures
- Certificate management
- Cryptographic policy compliance

### 14.2 Encryption Requirements
- Full disk encryption for laptops
- Database encryption for sensitive data
- TLS/SSL for network communications
- Email encryption for confidential information

## 15. MONITORING AND MEASUREMENT

### 15.1 Security Metrics
- Number and severity of incidents
- Patch compliance rates
- Training completion rates
- Vulnerability remediation times
- Access review completion

### 15.2 Continuous Improvement
- Regular management reviews
- Corrective and preventive actions
- Security improvement initiatives
- Benchmarking against industry standards

## 16. POLICY COMPLIANCE

### 16.1 Compliance Monitoring
- Regular compliance assessments
- Exception management process
- Violation reporting and investigation

### 16.2 Disciplinary Actions
Non-compliance may result in:
- Verbal or written warnings
- Suspension or termination
- Legal action
- Criminal prosecution

## 17. RELATED DOCUMENTS

- Acceptable Use Policy
- Password Policy
- Data Classification Standard
- Incident Response Plan
- Business Continuity Plan
- Remote Work Security Guidelines
- Third-Party Security Requirements

## 18. DEFINITIONS

**Information Asset:** Any data, device, or component that supports information-related activities
**Information Security Incident:** An event that compromises confidentiality, integrity, or availability
**Risk:** The potential for loss, damage, or harm
**Threat:** A potential cause of an unwanted incident
**Vulnerability:** A weakness that can be exploited

## 19. POLICY REVIEW AND APPROVAL

This policy shall be reviewed annually or when significant changes occur.

**Document History:**
- Version 1.0: Initial release - [Date]
- Version 2.0: Annual review and update - [Current Date]

**Approval:**
Approved by: [CISO Name]
Title: Chief Information Security Officer
Date: [Approval Date]

---

*For questions regarding this policy, contact the Information Security team at security@[Company Domain]*`
  },

  {
    name: "Non-Disclosure Agreement (NDA)",
    category: "Legal",
    description: "Standard mutual non-disclosure agreement for business partnerships",
    tags: ["NDA", "Legal", "Confidentiality", "Contract"],
    variables: ["Party A Name", "Party A Address", "Party B Name", "Party B Address", "Effective Date"],
    estimatedTime: "10-15 minutes",
    complianceStandards: ["Contract Law"],
    isDefault: true,
    content: `# MUTUAL NON-DISCLOSURE AGREEMENT

**This Mutual Non-Disclosure Agreement** ("Agreement") is entered into as of [Effective Date] ("Effective Date")

**BETWEEN:**

**[Party A Name]**
A company organized and existing under the laws of [Jurisdiction]
Address: [Party A Address]
("Party A")

**AND:**

**[Party B Name]**
A company organized and existing under the laws of [Jurisdiction]
Address: [Party B Address]
("Party B")

Each referred to individually as a "Party" and collectively as the "Parties."

## RECITALS

WHEREAS, the Parties wish to explore a potential business relationship and/or transaction (the "Purpose");

WHEREAS, in connection with the Purpose, each Party may disclose to the other certain confidential and proprietary information;

WHEREAS, the Parties desire to protect such confidential information pursuant to the terms and conditions of this Agreement;

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:

## 1. DEFINITION OF CONFIDENTIAL INFORMATION

### 1.1 Confidential Information Defined

"Confidential Information" means any and all non-public, proprietary, or confidential information disclosed by one Party ("Disclosing Party") to the other Party ("Receiving Party"), whether orally, in writing, or in any other form, including but not limited to:

a) **Technical Information:** Software, source code, object code, algorithms, system designs, architectures, schemas, protocols, APIs, data formats, technical specifications, and documentation;

b) **Business Information:** Business plans, strategies, methods, practices, financial information, cost data, pricing information, profit margins, supplier and vendor information, customer lists and data, marketing plans, and sales information;

c) **Intellectual Property:** Inventions, patents, patent applications, trade secrets, trademarks, service marks, copyrights, and any other intellectual property rights;

d) **Product Information:** Product plans, designs, specifications, requirements, roadmaps, and development schedules;

e) **Personnel Information:** Employee information, compensation data, organizational structures, and personnel policies;

f) **Other Information:** Any other information that is marked as "Confidential," "Proprietary," or with a similar designation, or that would reasonably be considered confidential under the circumstances.

### 1.2 Confidential Information Exclusions

Confidential Information does not include information that:

a) Was rightfully known to the Receiving Party before receipt from the Disclosing Party;

b) Is or becomes publicly available through no breach of this Agreement by the Receiving Party;

c) Is rightfully received by the Receiving Party from a third party without breach of any confidentiality obligation;

d) Is independently developed by the Receiving Party without use of or reference to Confidential Information;

e) Is approved for release by written authorization of the Disclosing Party;

f) Is required to be disclosed by law, regulation, or court order, provided that the Receiving Party provides prompt notice to the Disclosing Party and cooperates in any effort to seek protective treatment.

## 2. OBLIGATIONS OF THE RECEIVING PARTY

### 2.1 Use Restrictions

The Receiving Party agrees to:

a) Use the Confidential Information solely for the Purpose and not for any other purpose;

b) Not disclose Confidential Information to any third parties without the prior written consent of the Disclosing Party;

c) Limit access to Confidential Information to employees, agents, and representatives who have a legitimate need to know and who have signed confidentiality agreements containing provisions substantially similar to those herein;

d) Not copy, reproduce, or create derivative works based on Confidential Information except as necessary for the Purpose;

e) Not reverse engineer, disassemble, or decompile any software or other tangible objects that embody Confidential Information.

### 2.2 Standard of Care

The Receiving Party shall protect the confidentiality of the Confidential Information using the same degree of care it uses to protect its own confidential information of similar nature and importance, but in no event less than reasonable care.

### 2.3 Notification of Breach

The Receiving Party shall promptly notify the Disclosing Party in writing of any unauthorized use or disclosure of Confidential Information of which it becomes aware.

## 3. PERMITTED DISCLOSURES

### 3.1 Legal Compulsion

If the Receiving Party is legally compelled to disclose Confidential Information, it shall:

a) Promptly notify the Disclosing Party in writing, if legally permissible;

b) Cooperate with the Disclosing Party in seeking a protective order or other appropriate remedy;

c) If such protective order or remedy is not obtained, disclose only that portion of the Confidential Information that legal counsel advises is legally required;

d) Use reasonable efforts to obtain assurance that confidential treatment will be accorded to the disclosed Confidential Information.

### 3.2 Representatives

The Receiving Party may disclose Confidential Information to its employees, officers, directors, attorneys, accountants, financial advisors, and other representatives who:

a) Have a legitimate need to know for the Purpose;
b) Have been informed of the confidential nature of the information;
c) Are bound by confidentiality obligations at least as restrictive as those in this Agreement.

## 4. OWNERSHIP AND NO LICENSE

### 4.1 Retention of Rights

All Confidential Information shall remain the exclusive property of the Disclosing Party. Nothing in this Agreement shall be construed as granting any rights, by license or otherwise, to any Confidential Information or any patent, copyright, trademark, or other intellectual property rights.

### 4.2 No Obligation

Nothing in this Agreement shall obligate either Party to:
a) Enter into any further agreement or transaction;
b) Purchase any service or product;
c) Disclose any particular information.

## 5. TERM AND TERMINATION

### 5.1 Term

This Agreement shall commence on the Effective Date and continue for a period of [NUMBER] years, unless earlier terminated in accordance with this Section 5.

### 5.2 Termination

Either Party may terminate this Agreement at any time by providing thirty (30) days' written notice to the other Party.

### 5.3 Survival

The obligations of the Receiving Party with respect to Confidential Information disclosed prior to termination shall survive termination and continue for a period of [NUMBER] years from the date of termination, except for trade secrets, which shall be maintained in confidence indefinitely.

## 6. RETURN OF CONFIDENTIAL INFORMATION

Upon termination of this Agreement or upon request by the Disclosing Party, the Receiving Party shall promptly:

a) Return all tangible materials containing or representing Confidential Information;

b) Destroy all copies, notes, and derivative works of Confidential Information in any form;

c) Certify in writing the completion of the foregoing obligations.

Notwithstanding the foregoing, the Receiving Party may retain copies of Confidential Information to the extent required by applicable law or regulation, or in accordance with reasonable document retention policies, provided such retained copies remain subject to the confidentiality obligations herein.

## 7. NO WARRANTY

ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS." THE DISCLOSING PARTY MAKES NO WARRANTIES, EXPRESS OR IMPLIED, WITH RESPECT TO THE CONFIDENTIAL INFORMATION AND HEREBY DISCLAIMS ANY AND ALL IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

## 8. REMEDIES

### 8.1 Injunctive Relief

The Parties acknowledge that disclosure of Confidential Information in breach of this Agreement would cause irreparable harm for which monetary damages would be an inadequate remedy. Accordingly, the non-breaching Party shall be entitled to seek equitable relief, including injunction and specific performance, without prejudice to any other rights or remedies it may have.

### 8.2 Indemnification

The Receiving Party shall indemnify, defend, and hold harmless the Disclosing Party from and against any and all losses, damages, claims, costs, and expenses (including reasonable attorneys' fees) arising from or related to any breach of this Agreement by the Receiving Party.

## 9. GENERAL PROVISIONS

### 9.1 Governing Law

This Agreement shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law provisions.

### 9.2 Dispute Resolution

Any dispute arising out of or relating to this Agreement shall be resolved through:
a) First, good faith negotiations between the Parties;
b) If negotiations fail, binding arbitration in accordance with the rules of [Arbitration Organization].

### 9.3 Entire Agreement

This Agreement constitutes the entire agreement between the Parties concerning the subject matter hereof and supersedes all prior or contemporaneous agreements, whether written or oral, relating to such subject matter.

### 9.4 Amendment

This Agreement may only be amended or modified by a written instrument signed by both Parties.

### 9.5 Waiver

No waiver of any provision of this Agreement shall be effective unless in writing and signed by the Party against whom such waiver is sought to be enforced.

### 9.6 Severability

If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.

### 9.7 Assignment

Neither Party may assign this Agreement without the prior written consent of the other Party, except to a successor in connection with a merger, acquisition, or sale of all or substantially all of its assets.

### 9.8 Notices

All notices under this Agreement shall be in writing and deemed given when:
a) Delivered personally;
b) Sent by confirmed facsimile or email;
c) Sent by certified or registered mail, return receipt requested; or
d) Sent by overnight courier

To the addresses set forth above or to such other address as either Party may specify in writing.

### 9.9 Counterparts

This Agreement may be executed in counterparts, each of which shall be deemed an original and all of which together shall constitute one and the same instrument.

### 9.10 No Agency

Nothing in this Agreement shall be construed to create a partnership, joint venture, or agency relationship between the Parties.

## IN WITNESS WHEREOF

The Parties have executed this Mutual Non-Disclosure Agreement as of the Effective Date.

**[PARTY A NAME]**

By: _________________________________
Name: [Authorized Signatory Name]
Title: [Title]
Date: _______________________________

**[PARTY B NAME]**

By: _________________________________
Name: [Authorized Signatory Name]
Title: [Title]
Date: _______________________________`
  },

  {
    name: "Data Processing Agreement (DPA)",
    category: "Privacy",
    description: "GDPR-compliant data processing agreement for service providers",
    tags: ["GDPR", "DPA", "Data Processing", "Privacy"],
    variables: ["Controller Name", "Processor Name", "Processing Description", "Data Categories"],
    estimatedTime: "15-20 minutes",
    complianceStandards: ["GDPR", "Data Protection"],
    content: `# DATA PROCESSING AGREEMENT

**Effective Date:** [DATE]

This Data Processing Agreement ("DPA") is entered into between:

**Data Controller:** [Controller Name] ("Controller")
**Data Processor:** [Processor Name] ("Processor")

(each a "Party" and together the "Parties")

## 1. DEFINITIONS

In this DPA, the following terms shall have the meanings set out below:

- **"Applicable Law"** means all applicable data protection laws and regulations, including GDPR
- **"Controller"** has the meaning given in the GDPR
- **"Data Subject"** has the meaning given in the GDPR
- **"GDPR"** means Regulation (EU) 2016/679 (General Data Protection Regulation)
- **"Personal Data"** has the meaning given in the GDPR
- **"Personal Data Breach"** has the meaning given in the GDPR
- **"Processing"** has the meaning given in the GDPR
- **"Processor"** has the meaning given in the GDPR
- **"Sub-processor"** means any third party appointed by the Processor to process Personal Data
- **"Supervisory Authority"** has the meaning given in the GDPR

## 2. PROCESSING OF PERSONAL DATA

### 2.1 Scope and Roles

This DPA applies to all Processing of Personal Data by the Processor on behalf of the Controller in connection with the Services. The Parties acknowledge and agree that:
- The Controller is the Controller of the Personal Data
- The Processor is the Processor of the Personal Data
- The Controller retains control over the Personal Data and remains responsible for compliance

### 2.2 Processing Instructions

The Processor shall:
a) Process Personal Data only on documented instructions from the Controller
b) Immediately inform the Controller if instructions infringe Applicable Law
c) Not process Personal Data for any purpose other than those set out in Annex 1

### 2.3 Duration of Processing

Processing shall continue for the duration of the Services Agreement unless terminated earlier in accordance with this DPA.

## 3. PROCESSOR OBLIGATIONS

### 3.1 Compliance with Laws

The Processor shall comply with all Applicable Laws in the Processing of Personal Data.

### 3.2 Confidentiality

The Processor shall ensure that all personnel authorized to process Personal Data:
- Are subject to appropriate confidentiality obligations
- Process Personal Data only as necessary for the purposes specified
- Have received appropriate training on data protection

### 3.3 Security Measures

The Processor shall implement and maintain appropriate technical and organizational measures to ensure a level of security appropriate to the risk, including:

a) **Pseudonymization and encryption** of Personal Data
b) **Confidentiality, integrity, availability, and resilience** of processing systems
c) **Ability to restore** availability and access to Personal Data in a timely manner
d) **Regular testing** of security measures effectiveness
e) **Access controls** and authentication mechanisms
f) **Physical security** of data centers and facilities
g) **Network security** including firewalls and intrusion detection
h) **Regular security audits** and assessments

### 3.4 Data Subject Rights

The Processor shall:
- Assist the Controller in responding to Data Subject requests
- Implement appropriate measures to facilitate the exercise of Data Subject rights
- Promptly notify the Controller of any Data Subject requests received directly

## 4. SUB-PROCESSING

### 4.1 Authorization

The Processor shall not engage any Sub-processor without:
- Prior specific or general written authorization from the Controller
- A written agreement imposing the same obligations as in this DPA
- Remaining fully liable for Sub-processor performance

### 4.2 List of Sub-processors

Current approved Sub-processors are listed in Annex 2. The Processor shall:
- Inform the Controller of any intended changes concerning Sub-processors
- Provide the Controller with 30 days to object to changes
- Ensure Sub-processors comply with the same obligations

## 5. INTERNATIONAL TRANSFERS

### 5.1 Transfer Restrictions

The Processor shall not transfer Personal Data outside the EEA without:
- Prior written consent from the Controller
- Appropriate safeguards as required by GDPR Article 46
- Compliance with Chapter V of the GDPR

### 5.2 Transfer Mechanisms

Where transfers are authorized, the Processor shall ensure:
- Standard Contractual Clauses are in place
- Adequacy decisions are relied upon where applicable
- Supplementary measures are implemented where necessary

## 6. DATA BREACH MANAGEMENT

### 6.1 Breach Notification

The Processor shall notify the Controller without undue delay and within 24 hours after becoming aware of a Personal Data Breach, providing:
- Nature of the breach
- Categories and approximate number of Data Subjects affected
- Categories and approximate number of Personal Data records affected
- Likely consequences of the breach
- Measures taken or proposed to address the breach

### 6.2 Breach Assistance

The Processor shall:
- Assist in the investigation and mitigation of breaches
- Maintain records of all breaches
- Implement measures to prevent recurrence

## 7. AUDIT AND COMPLIANCE

### 7.1 Audit Rights

The Controller has the right to:
- Conduct audits and inspections of Processing activities
- Review compliance with this DPA
- Request evidence of compliance with security obligations

### 7.2 Cooperation

The Processor shall:
- Make available all necessary information to demonstrate compliance
- Allow and contribute to audits
- Provide certifications and third-party audit reports where available

## 8. DATA RETURN AND DELETION

### 8.1 Return or Deletion

Upon termination of the Services or upon Controller's request, the Processor shall:
- Return all Personal Data to the Controller in a commonly used format
- Delete all existing copies unless retention is required by law
- Certify compliance with deletion requirements

### 8.2 Retention Requirements

Where legal obligations require retention, the Processor shall:
- Inform the Controller of the legal requirement
- Protect the Personal Data from further processing
- Delete the Personal Data upon expiration of the retention period

## 9. LIABILITY AND INDEMNIFICATION

### 9.1 Liability Allocation

Each Party shall be liable for damages caused by its Processing that infringes the GDPR.

### 9.2 Indemnification

The Processor shall indemnify the Controller against:
- Damages awarded against the Controller by a court or Supervisory Authority
- Costs arising from the Processor's breach of this DPA
- Third-party claims resulting from Processor's non-compliance

## 10. GENERAL PROVISIONS

### 10.1 Governing Law

This DPA is governed by the laws of [Jurisdiction].

### 10.2 Order of Precedence

In case of conflict, this DPA prevails over the Services Agreement.

### 10.3 Amendments

Amendments must be in writing and signed by both Parties.

### 10.4 Severability

Invalid provisions shall not affect the validity of remaining provisions.

---

## ANNEX 1: PROCESSING DETAILS

### Subject Matter and Duration
- **Subject matter:** [Processing Description]
- **Duration:** For the term of the Services Agreement
- **Nature and Purpose:** [Specific purposes of processing]

### Categories of Data Subjects
- Employees of the Controller
- Customers of the Controller
- Suppliers/vendors of the Controller
- [Other categories as applicable]

### Categories of Personal Data
- Contact information (name, email, phone)
- Identification data (ID numbers, usernames)
- Financial information (as applicable)
- [Other categories as applicable]

### Processing Operations
- Collection and storage
- Organization and structuring
- Adaptation or alteration
- Retrieval and consultation
- Use and disclosure
- [Other operations as applicable]

---

## ANNEX 2: APPROVED SUB-PROCESSORS

| Sub-processor Name | Location | Processing Activities |
|-------------------|----------|----------------------|
| [Name] | [Country] | [Description] |
| [Name] | [Country] | [Description] |

---

## ANNEX 3: TECHNICAL AND ORGANIZATIONAL MEASURES

### Technical Measures
1. Encryption at rest using AES-256
2. Encryption in transit using TLS 1.2 or higher
3. Multi-factor authentication
4. Regular security patches and updates
5. Intrusion detection and prevention systems

### Organizational Measures
1. Security awareness training
2. Background checks for personnel
3. Incident response procedures
4. Regular risk assessments
5. Access control policies

---

**SIGNATURES**

**CONTROLLER:**
Name: _______________________
Title: _______________________
Date: _______________________
Signature: __________________

**PROCESSOR:**
Name: _______________________
Title: _______________________
Date: _______________________
Signature: __________________`
  },

  {
    name: "Employee Handbook",
    category: "HR",
    description: "Comprehensive employee handbook covering policies, procedures, and guidelines",
    tags: ["HR", "Employee", "Handbook", "Policies"],
    variables: ["Company Name", "Company Address", "HR Email", "Effective Date"],
    estimatedTime: "25-30 minutes",
    complianceStandards: ["Employment Law", "HR Best Practices"],
    content: `# EMPLOYEE HANDBOOK

**[Company Name]**
**Effective Date:** [DATE]
**Version:** 3.0

---

## WELCOME MESSAGE

Dear Team Member,

Welcome to [Company Name]! We're excited to have you as part of our team. This handbook is designed to provide you with important information about our company, culture, policies, and procedures.

This handbook serves as a guide to help you understand what we expect from you and what you can expect from us. It covers everything from our company values to specific policies and benefits. Please take time to read it thoroughly and refer back to it whenever you have questions.

We believe in creating a positive, inclusive, and productive work environment where everyone can thrive and contribute to our shared success. Your unique talents and perspectives are valued, and we look forward to your contributions.

If you have any questions about the content of this handbook, please don't hesitate to reach out to your manager or the HR team at [HR Email].

Welcome aboard!

[CEO Name]
Chief Executive Officer

---

## TABLE OF CONTENTS

1. **ABOUT OUR COMPANY**
2. **EMPLOYMENT POLICIES**
3. **WORKPLACE CONDUCT**
4. **COMPENSATION AND BENEFITS**
5. **TIME OFF AND LEAVES**
6. **HEALTH AND SAFETY**
7. **TECHNOLOGY AND SECURITY**
8. **PROFESSIONAL DEVELOPMENT**
9. **LEAVING THE COMPANY**
10. **ACKNOWLEDGMENT**

---

## 1. ABOUT OUR COMPANY

### 1.1 Our Mission
[Company Mission Statement - to be customized]

### 1.2 Our Vision
[Company Vision Statement - to be customized]

### 1.3 Our Core Values

**Integrity**
We act with honesty and honor without compromising the truth.

**Excellence**
We strive for the highest quality in everything we do.

**Innovation**
We embrace change and continuously seek better ways to serve our customers.

**Collaboration**
We work together, across boundaries, to meet the needs of our customers and help the company win.

**Respect**
We value diversity and treat everyone with dignity and fairness.

### 1.4 Company History
[Brief company history - to be customized]

### 1.5 Organizational Structure
Our company is organized into departments that work together to achieve our goals. Each department has specific responsibilities, but collaboration across teams is essential to our success.

---

## 2. EMPLOYMENT POLICIES

### 2.1 Equal Employment Opportunity

[Company Name] is an equal opportunity employer. We are committed to providing equal employment opportunities to all employees and applicants without regard to race, color, religion, sex, sexual orientation, gender identity, national origin, age, disability, genetic information, marital status, veteran status, or any other characteristic protected by law.

This policy applies to all aspects of employment including:
- Recruitment and hiring
- Compensation and benefits
- Promotions and transfers
- Training and development
- Discipline and termination

### 2.2 At-Will Employment

Employment with [Company Name] is at-will, meaning that either you or the company may terminate the employment relationship at any time, with or without cause or notice. This at-will relationship cannot be modified except by a written agreement signed by you and the CEO.

### 2.3 Employment Classifications

**Full-Time Employees**
- Work 40 hours per week
- Eligible for full benefits package

**Part-Time Employees**
- Work less than 30 hours per week
- Limited benefits eligibility

**Temporary Employees**
- Hired for specific projects or time periods
- Generally not eligible for benefits

**Exempt vs. Non-Exempt**
- Exempt: Salaried employees not eligible for overtime
- Non-Exempt: Hourly employees eligible for overtime pay

### 2.4 Background Checks

All offers of employment are contingent upon successful completion of:
- Criminal background check
- Reference verification
- Employment verification
- Education verification
- Drug screening (where applicable)

### 2.5 Immigration Compliance

We comply with the Immigration Reform and Control Act and E-Verify requirements. All employees must provide documentation proving their eligibility to work in the United States.

### 2.6 Personnel Records

We maintain personnel files for all employees containing:
- Application materials
- Performance evaluations
- Disciplinary records
- Benefits information

You may review your personnel file by scheduling an appointment with HR. Please notify HR of any changes to your personal information.

---

## 3. WORKPLACE CONDUCT

### 3.1 Code of Conduct

All employees are expected to:
- Treat others with respect and professionalism
- Maintain confidentiality of company and customer information
- Avoid conflicts of interest
- Report violations of company policies
- Represent the company positively

### 3.2 Anti-Harassment and Anti-Discrimination Policy

[Company Name] prohibits harassment and discrimination of any kind. This includes:

**Prohibited Conduct:**
- Sexual harassment
- Racial or ethnic slurs
- Religious discrimination
- Age-related harassment
- Disability discrimination
- Retaliation for reporting

**Reporting Procedures:**
1. Report to your immediate supervisor
2. If unavailable or involved, report to HR
3. All reports will be investigated promptly
4. Confidentiality maintained to the extent possible
5. No retaliation for good-faith reports

### 3.3 Workplace Violence Prevention

We maintain a zero-tolerance policy for workplace violence. Prohibited conduct includes:
- Physical assault or threats
- Intimidation or bullying
- Possession of weapons
- Threatening communications

Report any concerns immediately to management or security.

### 3.4 Drug and Alcohol Policy

To maintain a safe and productive workplace:
- Reporting to work under the influence is prohibited
- Possession or distribution of illegal substances is forbidden
- Prescription medications must not impair performance
- Alcohol may only be consumed at approved company events

Violations may result in immediate termination.

### 3.5 Dress Code and Appearance

**Business Professional (Client-facing roles):**
- Suits or professional attire
- Conservative colors and styles
- Minimal jewelry and fragrances

**Business Casual (Office):**
- Collared shirts or blouses
- Dress pants or skirts
- Closed-toe shoes

**Not Acceptable:**
- Revealing clothing
- Offensive graphics or messages
- Overly casual attire (unless designated casual day)

### 3.6 Attendance and Punctuality

Regular attendance is essential. Employees must:
- Arrive on time for scheduled shifts
- Notify supervisor before start time if absent
- Provide documentation for extended absences
- Schedule appointments outside work hours when possible

Excessive absences or tardiness may result in disciplinary action.

### 3.7 Conflict of Interest

Employees must avoid situations that conflict with company interests:
- Outside employment must be disclosed
- Business opportunities belong to the company
- Gifts over $50 value must be reported
- Family members in business relationships require disclosure

### 3.8 Confidentiality and Proprietary Information

All employees must protect confidential information:
- Customer data and lists
- Financial information
- Trade secrets and processes
- Strategic plans
- Employee information

This obligation continues after employment ends.

---

## 4. COMPENSATION AND BENEFITS

### 4.1 Compensation Philosophy

We strive to provide competitive compensation that:
- Attracts and retains talented employees
- Rewards performance and contribution
- Maintains internal equity
- Aligns with market standards

### 4.2 Payroll Procedures

**Pay Periods:**
- Bi-weekly (every two weeks)
- 26 pay periods per year
- Direct deposit available

**Timekeeping:**
- All non-exempt employees must record hours worked
- Submit timesheets by [deadline]
- Overtime must be pre-approved

### 4.3 Overtime Policy

Non-exempt employees are eligible for overtime:
- 1.5x regular rate for hours over 40 per week
- Prior approval required
- Accurate time recording mandatory
- Compensatory time not permitted

### 4.4 Performance Reviews

Performance evaluations occur:
- 90 days after hire
- Annually thereafter
- Additional reviews as needed

Reviews assess:
- Job performance
- Goal achievement
- Competency development
- Areas for improvement

### 4.5 Benefits Overview

**Health Insurance:**
- Medical, dental, and vision coverage
- Company pays [X]% of premiums
- Coverage begins first of month following hire
- Dependent coverage available

**Retirement Plan:**
- 401(k) with company match up to [X]%
- Immediate eligibility
- Vesting schedule applies

**Life Insurance:**
- Basic life insurance at 1x annual salary
- Additional coverage available
- Accidental death and dismemberment included

**Disability Insurance:**
- Short-term disability (STD)
- Long-term disability (LTD)
- Covers percentage of salary

### 4.6 Additional Benefits

**Flexible Spending Accounts (FSA):**
- Healthcare FSA
- Dependent care FSA
- Pre-tax contributions

**Employee Assistance Program (EAP):**
- Confidential counseling
- Legal and financial consultation
- Work-life balance resources

**Other Perks:**
- Gym membership reimbursement
- Professional development budget
- Employee discounts
- Commuter benefits

---

## 5. TIME OFF AND LEAVES

### 5.1 Paid Time Off (PTO)

**Accrual Rates:**
- 0-2 years: 15 days per year
- 3-5 years: 20 days per year
- 6+ years: 25 days per year

**PTO Guidelines:**
- Request in advance when possible
- Manager approval required
- Cannot exceed accrual balance
- Limited carryover allowed

### 5.2 Holidays

The following holidays are observed:
- New Year's Day
- Martin Luther King Jr. Day
- Presidents' Day
- Memorial Day
- Independence Day
- Labor Day
- Thanksgiving Day and Friday
- Christmas Eve and Day

### 5.3 Sick Leave

Employees may use PTO for illness. For extended illness:
- Provide doctor's note for absences over 3 days
- May qualify for FMLA or disability benefits
- Coordinate with HR for extended medical leave

### 5.4 Family and Medical Leave (FMLA)

Eligible employees may take up to 12 weeks unpaid leave for:
- Birth or adoption of a child
- Serious health condition
- Care for family member with serious health condition
- Qualifying military exigency

**Eligibility Requirements:**
- 12 months of employment
- 1,250 hours worked in past 12 months
- Work at location with 50+ employees

### 5.5 Parental Leave

In addition to FMLA:
- 6 weeks paid parental leave for birth/adoption
- Available to all parents
- Must be taken within 12 months of birth/adoption

### 5.6 Bereavement Leave

Up to 5 days paid leave for immediate family:
- Spouse/partner
- Children
- Parents
- Siblings

3 days for extended family members.

### 5.7 Jury Duty

Paid leave provided for jury service:
- Notify supervisor immediately upon receiving summons
- Provide documentation
- Return to work when dismissed early

### 5.8 Military Leave

Leave provided in accordance with USERRA:
- Job protection for up to 5 years
- Continuation of benefits available
- Prompt reinstatement upon return

---

## 6. HEALTH AND SAFETY

### 6.1 Workplace Safety

Everyone is responsible for maintaining a safe workplace:
- Follow all safety procedures
- Report hazards immediately
- Use required safety equipment
- Participate in safety training

### 6.2 Emergency Procedures

**Fire Emergency:**
1. Activate nearest fire alarm
2. Evacuate via nearest exit
3. Assemble at designated location
4. Do not re-enter until cleared

**Medical Emergency:**
1. Call 911
2. Notify supervisor
3. Do not move injured person unless necessary
4. Provide first aid if trained

### 6.3 Workers' Compensation

If injured at work:
1. Report immediately to supervisor
2. Seek medical attention if needed
3. Complete incident report within 24 hours
4. Cooperate with investigation

Benefits include:
- Medical expenses
- Lost wages (partial)
- Vocational rehabilitation if needed

### 6.4 Ergonomics

To prevent workplace injuries:
- Adjust workstation properly
- Take regular breaks
- Practice good posture
- Request ergonomic assessment if needed

### 6.5 Security

Maintain workplace security:
- Wear ID badges at all times
- Don't allow unauthorized access
- Lock computers when away
- Report suspicious activity
- Follow visitor procedures

---

## 7. TECHNOLOGY AND SECURITY

### 7.1 Acceptable Use Policy

Company technology must be used appropriately:
- Primarily for business purposes
- Limited personal use acceptable
- No illegal or inappropriate content
- No unauthorized software installation

### 7.2 Email and Internet Usage

**Email Guidelines:**
- Professional communication only
- No discriminatory or harassing content
- Confidential information must be encrypted
- Company retains right to monitor

**Internet Usage:**
- Business-related browsing
- No inappropriate websites
- No streaming unless work-related
- Personal use during breaks only

### 7.3 Social Media Policy

When using social media:
- Don't disclose confidential information
- Identify personal opinions as your own
- Be respectful and professional
- Don't speak on behalf of company without authorization

### 7.4 Mobile Device Policy

For company-issued devices:
- Password protection required
- Report loss immediately
- Personal use limited
- Company may remotely wipe if lost

### 7.5 Data Security

Protect company and customer data:
- Use strong passwords
- Lock screens when away
- Don't share credentials
- Report security incidents immediately
- Follow data classification guidelines

### 7.6 Remote Work

When working remotely:
- Maintain regular hours
- Ensure secure connection
- Protect confidential information
- Maintain productivity standards
- Comply with all policies

---

## 8. PROFESSIONAL DEVELOPMENT

### 8.1 Training and Development

We support employee growth through:
- Onboarding programs
- Skills training
- Leadership development
- Conference attendance
- Online learning platforms

### 8.2 Tuition Reimbursement

Eligible employees may receive reimbursement for:
- Job-related courses
- Degree programs
- Professional certifications

**Requirements:**
- Prior approval required
- Grade of B or better
- Continued employment commitment

### 8.3 Professional Memberships

Company may pay for:
- Professional association dues
- Industry publications
- Certification maintenance

### 8.4 Career Development

Opportunities include:
- Internal job postings
- Mentorship programs
- Stretch assignments
- Cross-functional projects

### 8.5 Performance Improvement

If performance needs improvement:
- Performance Improvement Plan (PIP) may be implemented
- Clear expectations and timeline provided
- Support and resources available
- Regular check-ins scheduled

---

## 9. LEAVING THE COMPANY

### 9.1 Resignation

When resigning:
- Provide written notice
- Two weeks minimum (professional courtesy)
- Work with supervisor on transition
- Complete exit interview

### 9.2 Termination

Termination may occur for:
- Performance issues
- Policy violations
- Misconduct
- Business needs

### 9.3 Exit Procedures

Upon separation:
- Return all company property
- Complete final timesheet
- Review benefits continuation options
- Receive final paycheck per state law

### 9.4 References

Reference requests directed to HR will confirm:
- Dates of employment
- Job title
- Salary (with authorization)

### 9.5 Rehire Eligibility

Former employees may be eligible for rehire depending on:
- Reason for separation
- Performance history
- Business needs
- Time elapsed

---

## 10. ACKNOWLEDGMENT

I acknowledge that I have received, read, and understood the [Company Name] Employee Handbook dated [DATE]. I understand that:

- This handbook supersedes all previous handbooks and policies
- The company may modify policies at any time
- This handbook is not an employment contract
- Employment is at-will
- I am expected to comply with all policies

I agree to:
- Follow all company policies and procedures
- Ask questions if I don't understand something
- Report violations of policies
- Keep my copy for reference

If I have questions about any policies, I will contact my supervisor or Human Resources.

**Employee Acknowledgment:**

_____________________________________
Employee Name (Print)

_____________________________________
Employee Signature

_____________________________________
Date

**HR Representative:**

_____________________________________
HR Representative Name

_____________________________________
HR Signature

_____________________________________
Date

---

**[Company Name]**
[Company Address]
[HR Email]
[Company Phone]

*This handbook is proprietary and confidential. Version 3.0 - [DATE]*`
  },

  {
    name: "Incident Response Plan",
    category: "Security",
    description: "Comprehensive security incident response plan with detailed procedures",
    tags: ["Security", "Incident Response", "Cybersecurity", "Emergency"],
    variables: ["Company Name", "CISO Email", "Security Hotline"],
    estimatedTime: "20-25 minutes",
    complianceStandards: ["ISO 27001", "NIST"],
    content: `# INCIDENT RESPONSE PLAN

**Classification:** Confidential
**Version:** 2.5
**Effective Date:** [DATE]
**Owner:** Chief Information Security Officer
**Review Cycle:** Quarterly

---

## EXECUTIVE SUMMARY

This Incident Response Plan (IRP) provides a systematic approach to managing security incidents at [Company Name]. It ensures rapid, effective, and orderly response to information security incidents, minimizing impact and supporting business continuity.

**Key Objectives:**
- Minimize incident impact and damage
- Reduce recovery time and costs
- Protect stakeholder interests
- Ensure regulatory compliance
- Prevent incident recurrence

**Critical Contacts:**
- Security Hotline: [Security Hotline]
- CISO Email: [CISO Email]
- Incident Commander On-Call: [Phone Number]

---

## 1. INTRODUCTION AND PURPOSE

### 1.1 Scope

This plan applies to all information security incidents affecting:
- Corporate IT systems and infrastructure
- Cloud services and SaaS applications
- Customer data and systems
- Third-party connections
- Physical security with IT implications
- Employee devices and BYOD

### 1.2 Incident Definition

An information security incident is any event that:
- Violates security policies
- Threatens confidentiality, integrity, or availability
- Indicates system compromise
- Involves unauthorized access
- Results in data breach or loss
- Disrupts business operations

### 1.3 Incident Categories

**Category 1 - Critical:**
- Data breach affecting >1000 records
- Complete system outage
- Ransomware deployment
- APT detection

**Category 2 - High:**
- Limited data exposure
- Partial system compromise
- Malware infection
- Insider threat activity

**Category 3 - Medium:**
- Policy violations
- Suspicious activity
- Failed attack attempts
- Minor system issues

**Category 4 - Low:**
- False positives
- Information gathering attempts
- Spam/phishing (blocked)

---

## 2. INCIDENT RESPONSE TEAM

### 2.1 Team Structure

**Incident Commander**
- Overall incident coordination
- Strategic decisions
- External communications
- Resource allocation

**Technical Lead**
- Technical response coordination
- System analysis and containment
- Evidence preservation
- Recovery operations

**Security Analyst**
- Threat investigation
- Log analysis
- Forensics support
- Documentation

**Communications Lead**
- Internal communications
- Customer notifications
- Media relations
- Regulatory reporting

**Legal Counsel**
- Legal requirements
- Law enforcement liaison
- Regulatory compliance
- Litigation support

**Business Representatives**
- Business impact assessment
- Continuity planning
- Stakeholder management
- Recovery prioritization

### 2.2 Escalation Matrix

| Severity | Initial Response | Escalation Time | Incident Commander | Executive Notification |
|----------|-----------------|------------------|-------------------|----------------------|
| Critical | Immediate | 15 minutes | Required | Within 1 hour |
| High | 30 minutes | 1 hour | Required | Within 4 hours |
| Medium | 2 hours | 4 hours | Optional | Next business day |
| Low | Next business day | N/A | Not required | Weekly report |

### 2.3 On-Call Rotation

24/7 coverage maintained through:
- Primary on-call: 1 week rotation
- Secondary backup: Always available
- Management escalation: CISO/CTO
- Handover procedures: Weekly briefing

---

## 3. INCIDENT RESPONSE PHASES

### 3.1 Phase 1: PREPARATION

**Proactive Measures:**

**Tools and Resources:**
- SIEM platform configured and monitored
- EDR agents deployed organization-wide
- Forensic toolkit prepared and tested
- Incident tracking system operational
- Communication templates ready
- Legal holds procedures documented

**Training and Awareness:**
- Quarterly tabletop exercises
- Annual incident response training
- Security awareness programs
- Playbook reviews and updates

**Documentation Required:**
- Asset inventory current
- Network diagrams updated
- Contact lists verified
- Runbooks validated
- Recovery procedures tested

### 3.2 Phase 2: DETECTION AND ANALYSIS

**Detection Sources:**
- Security monitoring tools
- User reports
- System alerts
- Third-party notifications
- Threat intelligence feeds

**Initial Triage Process:**

1. **Alert Validation (0-15 minutes)**
   - Verify alert authenticity
   - Check for false positives
   - Gather initial indicators

2. **Scope Assessment (15-30 minutes)**
   - Identify affected systems
   - Determine data involvement
   - Assess business impact

3. **Severity Classification (30-45 minutes)**
   - Apply severity criteria
   - Document initial findings
   - Initiate escalation if needed

**Analysis Activities:**
- Log collection and correlation
- Timeline construction
- IOC identification
- Attack vector determination
- Threat actor attribution (if possible)

### 3.3 Phase 3: CONTAINMENT

**Immediate Containment:**
- Isolate affected systems
- Block malicious IPs/domains
- Disable compromised accounts
- Preserve volatile evidence

**Short-term Containment:**
- Deploy temporary fixes
- Increase monitoring
- Implement additional controls
- Backup critical data

**Long-term Containment:**
- Remove backdoors
- Patch vulnerabilities
- Rebuild systems if necessary
- Validate containment effectiveness

**Evidence Preservation:**
- Create forensic images
- Collect relevant logs
- Document all actions
- Maintain chain of custody

### 3.4 Phase 4: ERADICATION

**Removal Actions:**
- Delete malicious files
- Remove unauthorized access
- Close vulnerabilities
- Reset compromised credentials
- Clean infected systems

**Verification Steps:**
- Scan for remaining indicators
- Verify patch deployment
- Confirm malware removal
- Validate system integrity

### 3.5 Phase 5: RECOVERY

**System Restoration:**
1. Restore from clean backups
2. Rebuild compromised systems
3. Apply all security patches
4. Reconfigure security controls
5. Update security signatures

**Validation Process:**
- Functionality testing
- Security validation
- Performance verification
- User acceptance testing

**Monitoring Enhancement:**
- Increased logging
- Enhanced alerting
- Additional monitoring
- Threat hunting activities

**Return to Operations:**
- Phased restoration
- Business verification
- User communication
- Normal operations resumption

### 3.6 Phase 6: POST-INCIDENT ACTIVITY

**Immediate Actions (24-48 hours):**
- Hot wash meeting
- Initial report draft
- Evidence preservation
- Cost assessment

**Short-term Actions (1 week):**
- Detailed incident report
- Root cause analysis
- Lessons learned documentation
- Improvement recommendations

**Long-term Actions (30 days):**
- Policy updates
- Process improvements
- Training updates
- Tool enhancements
- Metrics analysis

---

## 4. INCIDENT TYPES AND PLAYBOOKS

### 4.1 Ransomware Attack

**Immediate Actions:**
1. Isolate infected systems immediately
2. Disconnect network shares
3. Disable Remote Desktop Protocol
4. Preserve encrypted file samples

**Investigation:**
- Identify ransomware variant
- Determine infection vector
- Assess encryption scope
- Check for data exfiltration

**Containment:**
- Block C&C communications
- Prevent lateral movement
- Isolate backup systems
- Deploy EDR kill switches

**Recovery:**
- Assess backup viability
- Consider decryption options
- Rebuild affected systems
- Restore from clean backups

### 4.2 Data Breach

**Immediate Actions:**
1. Identify data types involved
2. Determine exposure scope
3. Preserve access logs
4. Stop ongoing exfiltration

**Legal Requirements:**
- Notify legal counsel immediately
- Assess regulatory obligations
- Prepare breach notifications
- Document for compliance

**Investigation:**
- Data classification and volume
- Unauthorized access timeline
- Exfiltration methods used
- Threat actor identification

**Notifications:**
- Regulatory (within 72 hours)
- Affected individuals
- Business partners
- Insurance carriers
- Law enforcement (if criminal)

### 4.3 Business Email Compromise

**Immediate Actions:**
1. Reset affected account credentials
2. Review email forwarding rules
3. Check for unauthorized OAuth apps
4. Preserve email logs

**Investigation:**
- Email access timeline
- Messages sent/deleted
- Data exposed
- Additional accounts compromised

**Containment:**
- Multi-factor authentication enforcement
- IP restrictions
- Conditional access policies
- Email filtering updates

### 4.4 Insider Threat

**Immediate Actions:**
1. Preserve evidence discretely
2. Monitor activity closely
3. Coordinate with HR/Legal
4. Assess data exposure

**Investigation:**
- Access pattern analysis
- Data movement tracking
- Behavioral indicators
- Motivation assessment

**Response Considerations:**
- Legal implications
- Employment law requirements
- Evidence requirements
- Prosecution potential

### 4.5 DDoS Attack

**Immediate Actions:**
1. Activate DDoS mitigation
2. Contact ISP/CDN provider
3. Implement rate limiting
4. Enable geographic filtering

**Mitigation:**
- Traffic scrubbing
- Black hole routing
- CDN acceleration
- Load balancer adjustment

**Communication:**
- Status page updates
- Customer notifications
- Stakeholder briefings

---

## 5. COMMUNICATION PROTOCOLS

### 5.1 Internal Communications

**Incident Bridge:**
- Conference bridge: [Number]
- Backup bridge: [Number]
- War room location: [Location]
- Collaboration channel: [Platform]

**Update Frequency:**
- Critical: Every 30 minutes
- High: Every 2 hours
- Medium: Every 4 hours
- Low: Daily

**Stakeholder Updates:**
- Executive team
- Department heads
- Affected business units
- IT operations

### 5.2 External Communications

**Customer Notifications:**
- Timing requirements
- Approved messaging
- Communication channels
- FAQ preparation

**Regulatory Reporting:**
- GDPR: 72 hours
- State laws: Varies
- Industry specific: Per requirements
- International: Country-specific

**Media Relations:**
- Designated spokesperson only
- Prepared statements
- No speculation
- Fact-based communication

**Law Enforcement:**
- When to engage
- Evidence requirements
- Information sharing
- Prosecution support

### 5.3 Communication Templates

**Initial Notification:**
"We are investigating a potential security incident detected at [time]. Our incident response team is actively working to assess and contain the situation. We will provide updates every [frequency]."

**Customer Notification:**
"We recently discovered a security incident that may have affected your account. We took immediate action to secure our systems and are working with security experts to investigate. Here's what we know and what we're doing..."

**Regulatory Notification:**
"Pursuant to [regulation], we are notifying you of a personal data breach discovered on [date]. The incident involved [description] affecting approximately [number] individuals..."

---

## 6. EVIDENCE HANDLING

### 6.1 Evidence Collection

**Types of Evidence:**
- System logs
- Network traffic
- Memory dumps
- Disk images
- Configuration files
- User activity logs
- Email records
- Access logs

**Collection Procedures:**
1. Document system state
2. Collect volatile data first
3. Create forensic copies
4. Hash verification
5. Secure storage

### 6.2 Chain of Custody

**Documentation Required:**
- Evidence identifier
- Collection date/time
- Collector name
- Collection method
- Transfer records
- Storage location
- Access log

### 6.3 Evidence Storage

**Requirements:**
- Encrypted storage
- Access controls
- Backup copies
- Retention period
- Disposal procedures

### 6.4 Legal Considerations

**Preservation Requirements:**
- Litigation holds
- Regulatory requirements
- Criminal investigations
- Insurance claims

---

## 7. RECOVERY AND BUSINESS CONTINUITY

### 7.1 Recovery Priorities

**Tier 1 - Critical (RTO: 4 hours)**
- Authentication systems
- Core network infrastructure
- Customer-facing services
- Payment processing

**Tier 2 - High (RTO: 24 hours)**
- Internal applications
- Email systems
- File servers
- Development environments

**Tier 3 - Medium (RTO: 72 hours)**
- Non-critical applications
- Archive systems
- Test environments

### 7.2 Recovery Procedures

**System Recovery:**
1. Verify backup integrity
2. Restore system data
3. Apply security patches
4. Reconfigure security
5. Validate functionality
6. Monitor for reinfection

**Data Recovery:**
1. Identify data loss scope
2. Locate backup sources
3. Restore data
4. Verify integrity
5. Reconcile transactions

### 7.3 Business Continuity

**Alternate Operations:**
- Failover procedures
- Manual workarounds
- Third-party services
- Communication plans

**Stakeholder Management:**
- Customer communication
- Vendor coordination
- Partner notifications
- Employee updates

---

## 8. METRICS AND REPORTING

### 8.1 Key Performance Indicators

**Response Metrics:**
- Mean Time to Detect (MTTD)
- Mean Time to Respond (MTTR)
- Mean Time to Contain (MTTC)
- Mean Time to Recovery (MTTR)

**Quality Metrics:**
- False positive rate
- Incident recurrence rate
- Escalation accuracy
- SLA compliance

### 8.2 Reporting Requirements

**Incident Report Contents:**
- Executive summary
- Timeline of events
- Technical details
- Impact assessment
- Response actions
- Lessons learned
- Recommendations

**Report Distribution:**
- Board of Directors: Quarterly
- Executive Team: Monthly
- Security Committee: Weekly
- Operations: Daily during incidents

---

## 9. TRAINING AND TESTING

### 9.1 Training Program

**Annual Requirements:**
- IRP overview training
- Role-specific training
- Tool training
- Communication procedures

### 9.2 Exercise Schedule

**Quarterly:**
- Tabletop exercises
- Communication tests
- Tool validation

**Semi-Annual:**
- Partial simulation
- Recovery testing

**Annual:**
- Full-scale exercise
- Third-party assessment
- Red team exercise

### 9.3 Improvement Process

**Post-Exercise:**
- Lessons learned
- Gap analysis
- Improvement plan
- Implementation tracking

---

## 10. APPENDICES

### Appendix A: Contact Information

**Internal Contacts:**
[Detailed contact list]

**External Contacts:**
- Law Enforcement
- Legal Counsel
- Insurance
- Vendors
- Regulators

### Appendix B: Tools and Resources

**Security Tools:**
- SIEM: [Platform]
- EDR: [Platform]
- Forensics: [Tools]
- Ticketing: [System]

### Appendix C: Regulatory Requirements

**Data Breach Notifications:**
- GDPR: 72 hours
- CCPA: Without delay
- HIPAA: 60 days
- PCI DSS: Immediately

### Appendix D: Technical Procedures

[Detailed technical runbooks]

### Appendix E: Templates

[Communication templates and forms]

---

**Document Control:**
- Last Review: [Date]
- Next Review: [Date]
- Approved By: [CISO Name]
- Distribution: Security Team, IT Management, Executive Team

**Version History:**
- v2.5: Current version - [Date]
- v2.0: Major update - [Previous Date]
- v1.0: Initial version - [Original Date]`
  }
];

// Export default for use in other modules
export { documentTemplates as default };