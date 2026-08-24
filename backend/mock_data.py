"""
Realistic Construction Compliance Knowledge Base.
Spans Statutory Building Codes (IBC, NEC, UPC, CBC, NYC Codes),
Project Specifications, and Field Inspection Logs.
"""

from typing import List, Dict, Any

MOCK_REGULATORY_DOCUMENTS: List[Dict[str, Any]] = [
    # -------------------------------------------------------------
    # ELECTRICAL TRADE
    # -------------------------------------------------------------
    {
        "id": "nec-2023-300-22-c",
        "doc_title": "NFPA 70: National Electrical Code (NEC 2023)",
        "clause_number": "NEC Article 300.22(C)",
        "document_type": "Code",
        "jurisdiction": "National",
        "trade": "Electrical",
        "page_or_section": "Chapter 3, Article 300, Section 300.22(C)(1)",
        "content": (
            "Article 300.22(C) Other Space Used for Environmental Air (Plenums). "
            "This section applies to spaces not specifically fabricated for environmental-handling purposes, "
            "such as the space above a suspended ceiling or below a raised floor used for environmental air-handling purposes. "
            "(1) Wiring Methods: The wiring methods for such spaces shall be limited to totally enclosed, "
            "noncombustible, raceways including Electrical Metallic Tubing (EMT), Intermediate Metal Conduit (IMC), "
            "Rigid Metal Conduit (RMC), Flexible Metal Conduit (FMC) in lengths not exceeding 1.8 m (6 ft), "
            "or Type MC metal-clad cable with an approved plenum rating. "
            "Rigid nonmetallic conduit (Schedule 40/80 PVC), Electrical Nonmetallic Tubing (ENT), "
            "and general nonmetallic raceways are strictly PROHIBITED from being installed in environmental air spaces "
            "or plenums due to the propagation of toxic fumes and combustible decomposition products during fire conditions."
        ),
    },
    {
        "id": "nec-2023-210-8-b",
        "doc_title": "NFPA 70: National Electrical Code (NEC 2023)",
        "clause_number": "NEC Article 210.8(B)",
        "document_type": "Code",
        "jurisdiction": "National",
        "trade": "Electrical",
        "page_or_section": "Chapter 2, Article 210, Section 210.8(B)(1-4)",
        "content": (
            "Article 210.8(B) Ground-Fault Circuit-Interrupter (GFCI) Protection for Other Than Dwelling Units. "
            "All 125-volt through 250-volt single-phase receptacles rated 50 amperes or less and all three-phase "
            "receptacles rated 100 amperes or less installed in the following locations shall be provided with GFCI protection: "
            "(1) Bathrooms and washrooms. (2) Commercial and institutional kitchens. (3) Rooftops and mechanical rooms. "
            "(4) Outdoors and unfinished site areas. (5) Sinks where receptacles are within 1.8 m (6 ft) of the outside edge. "
            "On active construction jobsites, all temporary 120V 15A and 20A branch circuit outlets utilized by trade workers "
            "shall have listed GFCI breakers or receptacles tested prior to equipment connection."
        ),
    },
    {
        "id": "nyc-elec-2020-300-22",
        "doc_title": "New York City Electrical Code (2020 Amendments)",
        "clause_number": "NYC EC Section 300.22(C)",
        "document_type": "Code",
        "jurisdiction": "NYC",
        "trade": "Electrical",
        "page_or_section": "Title 27, Chapter 3, Subchapter 2, Section 300.22",
        "content": (
            "NYC Electrical Code Amendment to NEC 300.22: In all commercial occupancies and Class 1 high-rise structures "
            "in the City of New York, all wiring methods installed in spaces used for environmental air (ceiling plenums) "
            "must be installed in zinc-coated steel Electrical Metallic Tubing (EMT) or Rigid Metal Conduit (RMC) "
            "with steel compression-type raintight/concretetight fittings. "
            "Die-cast zinc set-screw fittings and all forms of nonmetallic conduits (PVC, RTRC, ENT) are explicitly prohibited. "
            "Flexible metallic conduits are limited to a maximum length of 4 feet for luminaire whip drops."
        ),
    },
    {
        "id": "spec-260533-raceways",
        "doc_title": "Project Specification 26 05 33: Raceways and Boxes for Electrical Systems",
        "clause_number": "Project Spec Div 26 05 33 §2.01.B",
        "document_type": "Project Spec",
        "jurisdiction": "National",
        "trade": "Electrical",
        "page_or_section": "Division 26, Section 26 05 33, Page 6, Paragraph 2.01.B",
        "content": (
            "Section 2.01.B - Interior Raceways: "
            "1. Concealed Dry Interior Spaces & Return Air Plenums: Use Electrical Metallic Tubing (EMT) with steel compression fittings. "
            "2. Exposed Industrial Areas & Mechanical Rooms below 8 ft AFF: Use Galvanized Rigid Steel (GRS) Conduit. "
            "3. Under-Slab / Direct Burial: Schedule 40 PVC conduit allowed only when encased in a minimum 3-inch red concrete envelope. "
            "4. Prohibited Installations: Rigid Polyvinyl Chloride (PVC) conduit shall NEVER be routed exposed or concealed within "
            "above-ceiling return air plenums, electrical shafts, or emergency egress corridors."
        ),
    },
    {
        "id": "ir-2024-089-pvc-plenum",
        "doc_title": "Field Inspection & Non-Conformance Report #IR-2024-089",
        "clause_number": "Inspection NCR #IR-2024-089",
        "document_type": "Inspection Log",
        "jurisdiction": "National",
        "trade": "Electrical",
        "page_or_section": "Field Report NCR-089, Level 3 West Wing, Grid C3-C7",
        "content": (
            "Field Inspection Non-Conformance Notice: "
            "During rough-in MEP inspection on Level 3 (Building A), inspector noted the electrical subcontractor installed "
            "120 linear feet of 1-inch Schedule 40 PVC conduit for low-voltage DALI lighting controls in the drop-ceiling return plenum. "
            "Deficiency: Violation of NEC Article 300.22(C) and Project Specification 26 05 33 §2.01.B. "
            "Corrective Action Required: Subcontractor is ordered to demo and remove all PVC raceways in the plenum and re-install "
            "using EMT with steel compression fittings prior to ceiling tile installation."
        ),
    },

    # -------------------------------------------------------------
    # FIRE SAFETY TRADE
    # -------------------------------------------------------------
    {
        "id": "ibc-2021-714-firestop",
        "doc_title": "International Building Code (IBC 2021)",
        "clause_number": "IBC Section 714.4.1.2",
        "document_type": "Code",
        "jurisdiction": "National",
        "trade": "Fire Safety",
        "page_or_section": "Chapter 7: Fire and Smoke Protection Features, Section 714.4.1.2",
        "content": (
            "Section 714.4.1.2 Through-Penetration Firestop System. "
            "Penetrations through horizontal fire-resistance-rated assemblies (floors, roof-ceilings) and 1-hour/2-hour vertical fire barriers "
            "by pipes, conduits, cables, and ducts shall be protected by an approved through-penetration firestop system "
            "installed as tested in accordance with ASTM E814 or UL 1479. "
            "The firestop system shall have an F-rating and a T-rating of not less than the required fire-resistance rating of the assembly penetrated. "
            "Where penetrating items are insulated, the insulation shall be noncombustible or specifically listed in the firestop system design. "
            "Unsealed annular spaces or stuffing with non-rated mineral wool without intumescent sealant is strictly non-compliant."
        ),
    },
    {
        "id": "cbc-2022-title24-7a",
        "doc_title": "California Building Code (CBC 2022 Title 24, Part 2)",
        "clause_number": "CBC Chapter 7A, Section 706A.2",
        "document_type": "Code",
        "jurisdiction": "California",
        "trade": "Fire Safety",
        "page_or_section": "Title 24 Part 2, Chapter 7A, Section 706A.2",
        "content": (
            "Section 706A.2 Vents in Wildland-Urban Interface (WUI) Areas. "
            "Attic ventilation openings, foundation vents, and underfloor vents in designated fire hazard severity zones "
            "shall be protected with corrosion-resistant noncombustible wire mesh with openings not less than 1/16 inch (1.6 mm) "
            "and not more than 1/8 inch (3.2 mm) in any dimension, or shall be fitted with an approved listed ember-resistant vent design. "
            "Louvered vents without fine mesh or non-listed plastic louvers are strictly prohibited on exterior walls and soffits."
        ),
    },
    {
        "id": "spec-211313-sprinklers",
        "doc_title": "Project Specification 21 13 13: Wet-Pipe Fire Sprinkler Systems",
        "clause_number": "Project Spec Div 21 13 13 §3.02.D",
        "document_type": "Project Spec",
        "jurisdiction": "National",
        "trade": "Fire Safety",
        "page_or_section": "Division 21, Section 21 13 13, Page 4, Paragraph 3.02.D",
        "content": (
            "Section 3.02.D - Sprinkler Deflector Clearances: "
            "1. Minimum Clearance: Maintain a minimum unobstructed vertical clearance of 18 inches below all standard upright and "
            "pendant sprinkler heads to the top of storage, ductwork, piping racks, or tenant partitions. "
            "2. High-Density Storage / ESFR Heads: Maintain a minimum 36-inch clearance. "
            "3. Any obstruction exceeding 4 inches in width located closer than 18 inches to a sprinkler head requires an additional "
            "sprinkler head installed below the obstruction in accordance with NFPA 13."
        ),
    },
    {
        "id": "ir-2024-112-firestop-audit",
        "doc_title": "Field Inspection & Quality Audit Report #IR-2024-112",
        "clause_number": "Inspection Report #IR-2024-112",
        "document_type": "Inspection Log",
        "jurisdiction": "National",
        "trade": "Fire Safety",
        "page_or_section": "Quality Audit Report, Floor 4 Mechanical Shaft",
        "content": (
            "Special Inspection Report for Penetration Firestopping: "
            "Inspection of 4-inch chilled water pipe penetration through 2-hour concrete shear wall at Grid D4. "
            "Observation: Contractor packed annular space with raw ceramic fiber blanket but omitted the approved intumescent mastic sealant "
            "(Hilti CP 606 / 3M FireDam 150+). "
            "Status: NON-COMPLIANT. Fails UL System C-AJ-2001 and IBC 714.4. "
            "Action: Issue stop work on wall closure until certified firestop installer applies minimum 1/2-inch depth of listed elastomeric sealant."
        ),
    },

    # -------------------------------------------------------------
    # STRUCTURAL TRADE
    # -------------------------------------------------------------
    {
        "id": "ibc-2021-1011-stairs",
        "doc_title": "International Building Code (IBC 2021)",
        "clause_number": "IBC Section 1011.2 & 1011.11",
        "document_type": "Code",
        "jurisdiction": "National",
        "trade": "Structural",
        "page_or_section": "Chapter 10: Means of Egress, Sections 1011.2 & 1011.11",
        "content": (
            "Section 1011.2 Width and Capacity of Stairways: "
            "The minimum width of means of egress stairways serving an occupant load of 50 or more shall not be less than 44 inches (1118 mm). "
            "Stairways serving an occupant load of less than 50 shall have a minimum width of not less than 36 inches (914 mm). "
            "Section 1011.11 Handrail Height: "
            "Handrail height, measured vertically from the sloped plane adjoining the tread nosing or finished surface of ramp slope, "
            "shall be not less than 34 inches (864 mm) and not greater than 38 inches (965 mm). Handrails shall have continuous graspability "
            "and extend 12 inches minimum horizontally beyond the top riser and one tread depth beyond the bottom riser."
        ),
    },
    {
        "id": "cbc-2022-chapter16a-seismic",
        "doc_title": "California Building Code (CBC 2022 Title 24, Part 2)",
        "clause_number": "CBC Chapter 16A / ASCE 7-16 §13.6",
        "document_type": "Code",
        "jurisdiction": "California",
        "trade": "Structural",
        "page_or_section": "Title 24 Part 2, Chapter 16A, Section 1617A.1.18",
        "content": (
            "Chapter 16A Structural Design - Seismic Restraint of Nonstructural Components: "
            "For all structures in Seismic Design Categories (SDC) D, E, and F, all suspended mechanical, electrical, and plumbing (MEP) "
            "utilities must be engineered with lateral and longitudinal seismic sway bracing: "
            "1. Electrical conduits 2.5 inches (65 mm) trade diameter and larger suspended by trapeze hangers shall have rigid seismic bracing "
            "spaced at intervals not exceeding 40 ft for longitudinal and 20 ft for transverse bracing. "
            "2. Chilled water, steam, and fire protection pipes 2.5 inches or larger must have engineered seismic cable or strut bracing "
            "attached directly to structural concrete or structural steel, not metal decking."
        ),
    },
    {
        "id": "spec-033000-concrete",
        "doc_title": "Project Specification 03 30 00: Cast-in-Place Structural Concrete",
        "clause_number": "Project Spec Div 03 30 00 §2.03.A",
        "document_type": "Project Spec",
        "jurisdiction": "National",
        "trade": "Structural",
        "page_or_section": "Division 03, Section 03 30 00, Page 8, Paragraph 2.03.A",
        "content": (
            "Section 2.03.A Concrete Mix Designs & Compressive Strengths: "
            "1. Elevated Post-Tensioned Slabs & Shear Walls: Minimum 28-day compressive strength (f'c) shall be 4,500 psi (31.0 MPa), "
            "maximum water-cementitious materials ratio (w/cm) of 0.40, slump 4 to 6 inches, with 5% +/- 1.5% air entrainment. "
            "2. Foundation Footings & Grade Beams: Minimum 28-day compressive strength of 4,000 psi (27.6 MPa). "
            "3. Slab on Grade (Non-Structural): Minimum 28-day compressive strength of 3,500 psi. "
            "4. Cylinder break tests falling below 90% of specified f'c require structural engineering review, core extraction testing, "
            "and possible remedial carbon fiber composite wrapping."
        ),
    },
    {
        "id": "ir-2024-145-rebar-clearance",
        "doc_title": "Structural Special Inspection Report #STR-2024-042",
        "clause_number": "Inspection Report #STR-2024-042",
        "document_type": "Inspection Log",
        "jurisdiction": "California",
        "trade": "Structural",
        "page_or_section": "Special Inspection Log, Level 2 Post-Tensioned Deck",
        "content": (
            "Structural Rebar Pre-Pour Clearance Inspection: "
            "Inspector verified rebar spacing, bottom concrete cover (minimum 1.5 inches clear to forms using plastic tipped chairs), "
            "and post-tensioning tendon profiles along Grids B1-B9. "
            "Findings: Rebar lap splices meet ACI 318-19 requirements (Class B splices). Cover verified at 1.75 inches. "
            "Status: APPROVED FOR POUR. Concrete mix 4,500 PSI Post-Tensioned mix design (Mix #PT-450-SF) verified."
        ),
    },

    # -------------------------------------------------------------
    # PLUMBING TRADE
    # -------------------------------------------------------------
    {
        "id": "upc-2021-312-testing",
        "doc_title": "Uniform Plumbing Code (IAPMO UPC 2021)",
        "clause_number": "UPC Section 312.2",
        "document_type": "Code",
        "jurisdiction": "National",
        "trade": "Plumbing",
        "page_or_section": "Chapter 3: General Regulations, Section 312.2",
        "content": (
            "Section 312.2 Drainage and Vent System Testing (Hydrostatic Test): "
            "A water test shall be applied to the drainage system either in its entirety or in sections. "
            "If applied to the entire system, all openings in the piping shall be tightly closed, except the highest opening, "
            "and the system filled with water to the point of overflow. "
            "If the system is tested in sections, each opening shall be tightly plugged, and each section filled with water "
            "and tested with not less than a 10-foot (3048 mm) head of water. "
            "In testing successive sections, at least the upper 10 feet of the next preceding section shall be tested so that no joint "
            "or pipe in the building shall have been submitted to a test of less than a 10-foot head of water. "
            "The water shall be kept in the system for at least 15 minutes before inspection starts. "
            "The system shall prove water-tight and exhibit zero observable pressure loss or dripping."
        ),
    },
    {
        "id": "nyc-plumb-2020-604",
        "doc_title": "New York City Plumbing Code (2020)",
        "clause_number": "NYC PC Section 605.13 & 608.1",
        "document_type": "Code",
        "jurisdiction": "NYC",
        "trade": "Plumbing",
        "page_or_section": "Chapter 6: Water Supply and Distribution, Sections 605.13 & 608.1",
        "content": (
            "Section 605.13 Copper and Copper Alloy Pipe Joints: "
            "Solder joints on all potable domestic water piping shall be made with lead-free fluxes and lead-free solder alloys "
            "containing not more than 0.2 percent lead in accordance with NSF 61 and Safe Drinking Water Act standards. "
            "Section 608.1 Backflow Prevention: "
            "All commercial boiler feed lines, cooling tower makeup supplies, and chemical injection systems shall be protected "
            "by an approved Reduced Pressure Zone (RPZ) backflow preventer with drain air gap piped to an approved floor drain."
        ),
    },
    {
        "id": "spec-221116-piping",
        "doc_title": "Project Specification 22 11 16: Domestic Water Piping Systems",
        "clause_number": "Project Spec Div 22 11 16 §3.04",
        "document_type": "Project Spec",
        "jurisdiction": "National",
        "trade": "Plumbing",
        "page_or_section": "Division 22, Section 22 11 16, Page 7, Paragraph 3.04",
        "content": (
            "Section 3.04 Pressure Testing of Potable Water Lines: "
            "1. Hydrostatic Pressure: Test all domestic hot and cold water distribution lines with cold potable water to a minimum "
            "hydrostatic pressure of 150 psi (1034 kPa) or 1.5 times the working pressure, whichever is greater. "
            "2. Test Duration: Maintain test pressure for a minimum continuous duration of 4 hours with calibrated recording gauge. "
            "3. Allowable Drop: Zero psi pressure loss allowed. Pneumatic air pressure testing of plastic potable water piping is strictly PROHIBITED."
        ),
    },
    {
        "id": "ir-2024-177-dwv-test",
        "doc_title": "Plumbing Rough-In Inspection Report #PLB-2024-031",
        "clause_number": "Inspection Log #PLB-2024-031",
        "document_type": "Inspection Log",
        "jurisdiction": "NYC",
        "trade": "Plumbing",
        "page_or_section": "Plumbing Inspection Record, Risers 4 & 5, Floors 1-6",
        "content": (
            "Plumbing Rough Inspection Log: "
            "Witnessed hydrostatic head test of cast iron DWV waste and vent stack Risers 4 and 5 from Floor 1 to Floor 6. "
            "Conditions: System filled with water to roof vent terminal (42 ft static head). "
            "Held static pressure for 30 minutes. "
            "Observations: No leaks, sweat, or gasket weep observed on any no-hub couplings or cleanout plugs. "
            "Result: PASSED. Compliant with UPC 312.2 and NYC Plumbing Code."
        ),
    },
]
