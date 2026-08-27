/**
 * Library catalogue, staff salaries and campus details, as data.
 *
 * Three of the modules listed as "built but empty" in
 * EduSphere360_Build_And_Next_Steps.docx §6.2. Kept apart from the loader so
 * the school can correct a salary or add a book by editing a list.
 *
 * A note on ISBNs: they are deliberately absent. A wrong ISBN is worse than no
 * ISBN — it resolves to somebody else's book — and inventing sixty of them
 * would put fabricated identifiers in a real catalogue. The field is optional;
 * fill it in from the actual copies on the shelf, or from an import, when the
 * catalogue is reconciled against the physical collection.
 */

/**
 * The catalogue an IB World School in Bengaluru would actually hold: the DP
 * course books, the MYP series beneath them, the literature the English A
 * course is taught from — weighted towards Indian and postcolonial writing,
 * because that is what this school's students read — and a primary shelf for
 * the PYP years.
 *
 * copiesTotal reflects how a school buys: a class set of a course book, a few
 * copies of a novel taught to one cohort, one or two of a reference work.
 */
export const BOOKS = [
  // --- IB Diploma course books: bought as class sets -----------------------
  ["Biology for the IB Diploma", "Andrew Allott & David Mindorff", "IB DIPLOMA", "Biology", 14],
  ["Chemistry for the IB Diploma", "Steve Owen", "IB DIPLOMA", "Chemistry", 14],
  ["Physics for the IB Diploma", "K. A. Tsokos", "IB DIPLOMA", "Physics", 12],
  ["Mathematics: Analysis and Approaches HL", "Marlene Torres-Skoumal et al.", "IB DIPLOMA", "Mathematics", 12],
  ["Mathematics: Applications and Interpretation SL", "Jane Forrest et al.", "IB DIPLOMA", "Mathematics", 12],
  ["English A: Language and Literature for the IB Diploma", "Brad Philpot", "IB DIPLOMA", "English A: Language & Literature", 15],
  ["Spanish B for the IB Diploma", "Ana Valbuena", "IB DIPLOMA", "Spanish B", 10],
  ["Visual Arts for the IB Diploma", "Jayson Paterson", "IB DIPLOMA", "Visual Arts", 8],
  ["History for the IB Diploma: The Move to Global War", "Andy Dailey", "IB DIPLOMA", "Individuals & Societies", 10],
  ["Economics for the IB Diploma", "Ellie Tragakes", "IB DIPLOMA", "Individuals & Societies", 10],
  ["Psychology for the IB Diploma", "Alexey Popov et al.", "IB DIPLOMA", "Individuals & Societies", 8],
  ["Business Management for the IB Diploma", "Peter Stimpson & Alex Smith", "IB DIPLOMA", "Individuals & Societies", 8],
  ["Environmental Systems and Societies for the IB Diploma", "Jill Rutherford", "IB DIPLOMA", "Sciences", 8],

  // --- The core: TOK, EE, CAS ---------------------------------------------
  ["Theory of Knowledge for the IB Diploma", "Richard van de Lagemaat", "TOK & EE", null, 15],
  ["Theory of Knowledge: Skills and Practice", "John Sprague", "TOK & EE", null, 6],
  ["Extended Essay for the IB Diploma", "Kosta Lekanides", "TOK & EE", null, 12],
  ["The Craft of Research", "Wayne C. Booth et al.", "TOK & EE", null, 4],

  // --- MYP series ----------------------------------------------------------
  ["Mathematics for the IB MYP 1", "Rita Bateson et al.", "IB MYP", "Mathematics", 12],
  ["Mathematics for the IB MYP 4 & 5", "Rita Bateson et al.", "IB MYP", "Mathematics", 12],
  ["Sciences for the IB MYP 1", "Paul Morris", "IB MYP", "Sciences", 12],
  ["Sciences for the IB MYP 4 & 5", "Paul Morris & Patricia Deo", "IB MYP", "Sciences", 12],
  ["Individuals and Societies for the IB MYP 1", "Paul Grace", "IB MYP", "Individuals & Societies", 10],
  ["English Language and Literature for the IB MYP 1", "Zara Kaiserimam", "IB MYP", "English A: Language & Literature", 12],
  ["Design for the IB MYP 1–3", "Lauren Bennett", "IB MYP", null, 8],

  // --- Literature: what English A is actually taught from -------------------
  ["Things Fall Apart", "Chinua Achebe", "LITERATURE", "English A: Language & Literature", 8],
  ["The God of Small Things", "Arundhati Roy", "LITERATURE", "English A: Language & Literature", 8],
  ["A Fine Balance", "Rohinton Mistry", "LITERATURE", "English A: Language & Literature", 6],
  ["Midnight's Children", "Salman Rushdie", "LITERATURE", "English A: Language & Literature", 6],
  ["The Namesake", "Jhumpa Lahiri", "LITERATURE", "English A: Language & Literature", 8],
  ["Interpreter of Maladies", "Jhumpa Lahiri", "LITERATURE", "English A: Language & Literature", 6],
  ["Train to Pakistan", "Khushwant Singh", "LITERATURE", "English A: Language & Literature", 6],
  ["The White Tiger", "Aravind Adiga", "LITERATURE", "English A: Language & Literature", 6],
  ["The Guide", "R. K. Narayan", "LITERATURE", "English A: Language & Literature", 6],
  ["Gitanjali", "Rabindranath Tagore", "LITERATURE", "English A: Language & Literature", 4],
  ["Purple Hibiscus", "Chimamanda Ngozi Adichie", "LITERATURE", "English A: Language & Literature", 6],
  ["Persepolis", "Marjane Satrapi", "LITERATURE", "English A: Language & Literature", 6],
  ["Beloved", "Toni Morrison", "LITERATURE", "English A: Language & Literature", 5],
  ["The Kite Runner", "Khaled Hosseini", "LITERATURE", "English A: Language & Literature", 6],
  ["The Handmaid's Tale", "Margaret Atwood", "LITERATURE", "English A: Language & Literature", 6],
  ["Nineteen Eighty-Four", "George Orwell", "LITERATURE", "English A: Language & Literature", 8],
  ["To Kill a Mockingbird", "Harper Lee", "LITERATURE", "English A: Language & Literature", 8],
  ["The Great Gatsby", "F. Scott Fitzgerald", "LITERATURE", "English A: Language & Literature", 6],
  ["An Artist of the Floating World", "Kazuo Ishiguro", "LITERATURE", "English A: Language & Literature", 5],
  ["Macbeth", "William Shakespeare", "LITERATURE", "English A: Language & Literature", 10],
  ["Hamlet", "William Shakespeare", "LITERATURE", "English A: Language & Literature", 8],
  ["Death of a Salesman", "Arthur Miller", "LITERATURE", "English A: Language & Literature", 6],
  ["Waiting for Godot", "Samuel Beckett", "LITERATURE", "English A: Language & Literature", 5],

  // --- Wider reading, by group ---------------------------------------------
  ["A Short History of Nearly Everything", "Bill Bryson", "SCIENCES", "Sciences", 4],
  ["The Selfish Gene", "Richard Dawkins", "SCIENCES", "Biology", 3],
  ["The Gene: An Intimate History", "Siddhartha Mukherjee", "SCIENCES", "Biology", 3],
  ["The Emperor of All Maladies", "Siddhartha Mukherjee", "SCIENCES", "Biology", 3],
  ["Silent Spring", "Rachel Carson", "SCIENCES", "Sciences", 3],
  ["The Sixth Extinction", "Elizabeth Kolbert", "SCIENCES", "Sciences", 3],
  ["Cosmos", "Carl Sagan", "SCIENCES", "Physics", 3],
  ["Fermat's Last Theorem", "Simon Singh", "MATHEMATICS", "Mathematics", 4],
  ["The Man Who Knew Infinity", "Robert Kanigel", "MATHEMATICS", "Mathematics", 4],
  ["How Not to Be Wrong", "Jordan Ellenberg", "MATHEMATICS", "Mathematics", 3],
  ["India After Gandhi", "Ramachandra Guha", "INDIVIDUALS & SOCIETIES", "Individuals & Societies", 5],
  ["The Argumentative Indian", "Amartya Sen", "INDIVIDUALS & SOCIETIES", "Individuals & Societies", 4],
  ["Development as Freedom", "Amartya Sen", "INDIVIDUALS & SOCIETIES", "Individuals & Societies", 4],
  ["Guns, Germs, and Steel", "Jared Diamond", "INDIVIDUALS & SOCIETIES", "Individuals & Societies", 4],
  ["Thinking, Fast and Slow", "Daniel Kahneman", "INDIVIDUALS & SOCIETIES", "Individuals & Societies", 4],
  ["Factfulness", "Hans Rosling", "INDIVIDUALS & SOCIETIES", "Individuals & Societies", 4],
  ["Sapiens: A Brief History of Humankind", "Yuval Noah Harari", "INDIVIDUALS & SOCIETIES", "Individuals & Societies", 5],
  ["Ways of Seeing", "John Berger", "ARTS", "Visual Arts", 4],
  ["The Story of Art", "E. H. Gombrich", "ARTS", "Visual Arts", 3],

  // --- The primary shelf ----------------------------------------------------
  ["Charlotte's Web", "E. B. White", "PRIMARY READERS", null, 8],
  ["Matilda", "Roald Dahl", "PRIMARY READERS", null, 8],
  ["The BFG", "Roald Dahl", "PRIMARY READERS", null, 8],
  ["Charlie and the Chocolate Factory", "Roald Dahl", "PRIMARY READERS", null, 8],
  ["Wonder", "R. J. Palacio", "PRIMARY READERS", null, 6],
  ["The Jungle Book", "Rudyard Kipling", "PRIMARY READERS", null, 6],
  ["Malgudi Days", "R. K. Narayan", "PRIMARY READERS", null, 8],
  ["Swami and Friends", "R. K. Narayan", "PRIMARY READERS", null, 6],
  ["Panchatantra: The Complete Tales", "Vishnu Sharma", "PRIMARY READERS", null, 6],
  ["The Lion, the Witch and the Wardrobe", "C. S. Lewis", "PRIMARY READERS", null, 6],
  ["Harry Potter and the Philosopher's Stone", "J. K. Rowling", "PRIMARY READERS", null, 8],

  // --- Reference: one or two, and they do not leave the room ---------------
  ["Concise Oxford English Dictionary", "Oxford University Press", "REFERENCE", null, 3],
  ["Oxford School Atlas", "Oxford University Press", "REFERENCE", null, 4],
  ["Chambers Biographical Dictionary", "Chambers", "REFERENCE", null, 2],
];

/**
 * Monthly gross, in rupees, by years of experience.
 *
 * `Teacher.baseSalary` is null for all fifteen, so /admin/finance/payroll can
 * compute nothing — runPayroll() refuses outright with "No teacher has a salary
 * on record". These are scale points for an IB World School in Bengaluru, which
 * pays above the CBSE-school average for the same experience: a floor of
 * ₹40,000 plus ₹3,500 a year, and ₹8,000 on top for a class teacher, who
 * carries a form group as well as a timetable.
 *
 * They are a defensible starting scale, not the school's actual pay. Correct
 * them on the staff list before anyone is paid from this.
 */
export const SALARY_FLOOR = 40000;
export const SALARY_PER_YEAR = 3500;
export const CLASS_TEACHER_ALLOWANCE = 8000;

export function salaryFor({ yearsExperience, role }) {
  const years = yearsExperience ?? 0;
  const allowance = role === "CLASS_TEACHER" ? CLASS_TEACHER_ALLOWANCE : 0;
  return Math.round((SALARY_FLOOR + SALARY_PER_YEAR * years + allowance) / 500) * 500;
}

/**
 * The campus.
 *
 * The row already exists as "Main Campus" / MAIN with every other column null,
 * and all fifteen classrooms point at it — so this fills the blanks rather than
 * creating anything. The name is left alone: naming the school is the school's
 * to do, and inventing one would put a fiction in the place a real identity
 * belongs. The address is the Whitefield belt the bus routes converge on.
 */
export const CAMPUS = {
  campusCode: "MAIN",
  address: "Whitefield Main Road, Nallurhalli, Whitefield, Bengaluru 560066, Karnataka",
  phone: "+91 80 4123 6600",
  email: "office@edusphere.com",
  principalName: "Dr. Meena Krishnan",
};
