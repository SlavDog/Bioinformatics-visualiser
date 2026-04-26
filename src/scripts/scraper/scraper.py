import re
import json
import requests
import time
from sympy import Not, Symbol, simplify_logic, Or, And # type: ignore
from bs4 import BeautifulSoup
from typing import Any, TypedDict

SemToCodes = dict[int, list[str]]
SuccessorCodes = dict[str, tuple[list[list[str]], bool]]

class ResultData(TypedDict):
    codes: list[str]
    choices: dict[str, Any]
    spec: dict[str, dict[int, list[str]]]

class SubjectLink(TypedDict):
    code: str
    groups: list[list[str]]
    by_prerequisites: bool

class SubjectDict(TypedDict):
    name: str
    faculty: str
    successors: list[SubjectLink]
    language: str
    predecessors: list[SubjectLink]
    completion: str
    credits: int
    link: str
    type: str

SubjectSuccessors = dict[str, SubjectDict]

class FinalJson(TypedDict):
    details: SubjectSuccessors
    spec: dict[str, dict[int, list[str]]]
    choices: dict[str, Any]
    substitutions: dict[str, Any]


MANUAL_SUBSTITUTIONS = {
    "advanced_math": {
        "nameCZ": "Pokročilá matematika",
        "removes": ["MB141", "MB142", "MB143"],
        "type": "MA",
        "adds": [{"code": "MB151", "semester": 2},
                 {"code": "MB152", "semester": 3},
                 {"code": "MB153", "semester": 4},
                 {"code": "MB154", "semester": 3}]
    },
    "advanced_inf": {
        "nameCZ": "Pokročilá informatika",
        "removes": ["IB000ext", "IB113", "IB114"],
        "type": "IN",
        "adds": [
            {"code": "IB000", "semester": 1},
            {"code": "IB111", "semester": 1},
            {"code": "IB002", "semester": 2}
        ]
    }
}

REQUEST_DELAY_SECONDS = 1

def extract_codes(filename: str) -> ResultData:
    """
    Extract all subject codes, choice groups, and specialization
    subjects from the input MUNI catalogue format JSON file.

    Parameters:
        filename (str): Name of the input file.

    Returns:
        ResultData: A dictionary containing all subject codes, choice groups, and specialization subjects.
    """
    result_data: ResultData = {"codes": [],
                               "choices": {},
                               "spec": {}}
    with open(filename, "r", encoding='utf-8') as source:
        data = json.load(source)

        # Write down all base subjects
        for subject in data["base"]:
            if "code" in subject:
                result_data["codes"].append(subject["code"])                
            elif "choice" in subject:
                continue
        for spec in data["spec"].values():
            for subject in spec["base"]:
                if "code" in subject:
                    result_data["codes"].append(subject["code"])

        # Write down every subject from a certain choice group
        for choice in data["choices"]:
            result_data["choices"][choice] = data["choices"][choice]
            if not ("tv" == choice or "core" == choice): # we must ignore CORE and PE
                for subject in data["choices"][choice]["list"]:
                    result_data["codes"].append(subject)

        # Write down all specialization subjects
        for specialization in data["spec"].values():
            for subject in specialization["base"]:
                if "choice" in subject:
                    continue
                result_data["codes"].append(subject["code"])


    for element in MANUAL_SUBSTITUTIONS.values():
        for subject in element["adds"]:
            result_data["codes"].append(subject["code"])

    result_data["spec"] = data["spec"]
    return result_data


def find_successor_codes(html: str, code: str, by_prerequisites: bool = True) -> SuccessorCodes:
    """
    Find all successor subject codes from the desired section
    of the MUNI subject catalogue HTML page.

    Parameters:
        html (str): The HTML content of the MUNI catalogue page.
        code (str): The parent subject code.
        by_prerequisites (bool, optional): Defaults to True. Determines whether
            successors are taken from the "Nachází se v prerekvizitách"
            section (True) or the "Navazující předměty" section (False).

    Returns:
        SuccessorCodes: A dictionary mapping successor subject codes to a tuple
            containing the OR groups the subject appears in, and a boolean
            indicating whether the edge is a prerequisite (True) or a soft
            follow-up (False).
    """
    result = []
    section_title = 'Nachází se v prerekvizitách jiných předmětů'
    if not by_prerequisites:
        section_title = 'Navazující předměty'

    section_pattern = re.compile(
        rf'<dt>\s*<b>\s*{re.escape(section_title)}\s*</b>\s*</dt>\s*<dd>(.*?)</dd>',
        re.IGNORECASE | re.DOTALL
    )
    match = section_pattern.search(html)
    if not match:
        return {}
    section = match.group(1)

    if not by_prerequisites:
        pattern = re.compile(r'<a href="(?:/(?:auth/)?predmet/[^"]+)"><b>([^<]+)</b>(?:.*?)</a>', re.IGNORECASE)
        return {code : ([], False) for code in pattern.findall(section)}
    
    pattern = re.compile(r'<a href="/(?:auth/)?predmet/[^"]+"><b>([^<>]+)</b>.*?</a><br\s*/>\s*\n?(.*?)(?=&nbsp;)', re.IGNORECASE)
    
    found_subjects_with_prerequisites = pattern.findall(section)

    for successor_subject, formula in found_subjects_with_prerequisites:
        formula = BeautifulSoup(formula, "html.parser").get_text() # clean from HTML tags
        try: 
            required, groups = parse_and_evaluate_formula(code, formula)
            if required:
                result.append((successor_subject, groups))
        except Exception as e:
            printRed(e)
            printRed(f"Couldn't evaluate prerequisite formula {formula} for subject {successor_subject}. Skipping.")
    return {code : (group, True) for code, group in result}
    

def parse_and_evaluate_formula(code: str, formula: str) -> tuple[bool, list[list[str]]]:
    """
    Determine whether a specific subject code is required in a prerequisite formula.

    This function processes a prerequisite formula from the MUNI catalogue,
    normalizes its syntax, converts subject codes into symbolic variables, 
    and uses symbolic logic to determine if the given `code` appears as a 
    required (non-negated) term.

    Parameters:
        code (str):
            The subject code to check (parent subject).
        formula (str):
            The raw prerequisite formula of the successor subject.

    Returns:
        Tuple[bool,list[list[str]]]:
            A tuple where the first element indicates whether the `code` is 
            required in the formula, and the second element is a list of 
            OR-groups found in the formula that include the `code`.
    """
    # ignore all program, faculty and study major prerequisites
    formula = re.sub(re.compile(r"(?:!)?program\([^)]*\)", re.IGNORECASE), "PROG", formula)
    formula = re.sub(re.compile(r"(?:!)?typ_studia\([^)]*\)", re.IGNORECASE), "STUD", formula)
    formula = re.sub(re.compile(r"(?:!)?fakulta\([^)]*\)", re.IGNORECASE), "FAC", formula)

    # remove NOW(...) subjects
    formula = re.sub(re.compile(r"NOW\(([^)]*)\)", re.IGNORECASE), "NOW", formula)

    # replace ANY(...) or NOWANY(...) with equivalent OR expression
    # (the replace_any function is automatically called by re.sub 
    # with the match object as an argument)
    formula = re.sub(re.compile(r"NOWANY\(([^)]*)\)", re.IGNORECASE), replace_any, formula)
    formula = re.sub(re.compile(r"ANY\(([^)]*)\)", re.IGNORECASE), replace_any, formula)

    formula = formula.replace("&&", "&").replace("||", "|").replace("!", "~")
    
    symbols_dict: dict[str, Symbol] = {}
    all_codes = re.findall(r"[A-Za-z0-9:_ř]+", formula)
    for i, subject_code in enumerate(set(all_codes)):
        symbols_dict[subject_code.capitalize()] = Symbol(f"a{i}")
        pattern = r'\b' + re.escape(subject_code) + r'\b'
        formula = re.sub(pattern, f"a{i}", formula)

    reverse_dict = {v: k for k, v in symbols_dict.items()}
    groups = extract_or_groups(simplify_logic(formula), reverse_dict)
    groups = [list(map(str.upper, group)) for group in groups]
    groups = list(filter(lambda group: code in group, groups))

    expr = simplify_logic(formula)
    code = re.sub(r"^[^:]*:(.*)", r"\1", code).capitalize()

    symbol = symbols_dict.get(code)
    if not symbol:   # In case we deleted the subject when removing NOW
        return False, groups
    return not expr.has(~symbol), groups


def extract_or_groups(expr: Symbol, reverse_dict: dict[Symbol, str]) -> list[list[str]]:
    """
    Recursively extract all OR groups from a symbolic logic expression.

    Parameters:
        expr (Symbol): The symbolic logic expression to analyze.
        reverse_dict (dict[Symbol, str]): Mapping from sympy symbols back to subject codes.

    Returns:
        list[list[str]]: A list of OR groups, where each group is a list of subject codes
            that appear together in an OR clause.
    """
    groups = []
    if isinstance(expr, Or):
        syms = [a for a in expr.args if isinstance(a, Symbol)]
        if len(syms) > 1:
            groups.append([reverse_dict[s] for s in syms])
        for a in expr.args:
            groups.extend(extract_or_groups(a, reverse_dict))
    elif isinstance(expr, And):
        for a in expr.args:
            groups.extend(extract_or_groups(a, reverse_dict))
    elif isinstance(expr, Not):
        groups.extend(extract_or_groups(expr.args[0], reverse_dict))
    return groups


def replace_any(match: re.Match[str]) -> str:
    """
    Replace ANY(...) or NOWANY(...) expressions with equivalent OR syntax.
    Intended to be used as a re.sub callback.

    Parameters:
        match (re.Match[str]): The regex match object containing the ANY/NOWANY expression.

    Returns:
        str: The equivalent OR expression, e.g. '(A | B | C)'.
    """
    args = match.group(1).split(",")
    args = [arg.strip() for arg in args]
    return "(" + " | ".join(args) + ")"


def transform_code_to_link(code: str, faculty: str = "") -> str:
    """
    Transform a subject code into a URL path.

    Parameters:
        code (str): The subject code to transform.
        faculty (str): The full faculty name.

    Returns:
        str: The URL path corresponding to the subject code.
    """
    pattern = re.compile(r'PřF:(.*)')
    match = pattern.search(code)
    if match:
        return f"/predmet/sci/{match.group(1)}"
    if faculty == "Přírodovědecká fakulta":
        return f"/predmet/sci/{code}"
    return f"/predmet/fi/{code}"


def transform_link_to_code(link: str) -> str:
    """
    Transform a URL path into a subject code.

    Parameters:
        link (str): The URL path of the subject.

    Returns:
        str: The subject code corresponding to the URL path of the subject.
    """
    pattern = re.compile(r'([^/]+)/([^/]+)/([^/]+)$')
    match = pattern.search(link)
    if match:
        first_group = match.group(1)
        second_group = match.group(2)
        if first_group == "sci" or second_group == "sci":
            return f"PřF:{match.group(3)}"
        else:
            return match.group(3)
    else:
        raise ValueError("Incorrect link format!")


def build_subject_dict(data: ResultData) \
        -> SubjectSuccessors:
    """
    Fetch and build a dictionary of subject data by scraping the MUNI catalogue.

    For each subject code in data, fetches the corresponding MUNI IS page,
    extracts subject details and successor relationships, and populates
    predecessor lists accordingly.

    Parameters:
        data (ResultData): Extracted subject codes and metadata from the input JSON.

    Returns:
        SubjectSuccessors: A dictionary mapping subject codes to their full subject data.
    """
    subject_codes = data["codes"]
    subject_data = {}
    predecessors: dict[str, list[SubjectLink]] = {}

    for code in subject_codes:
        link = transform_code_to_link(code)

        response = requests.get(f"https://is.muni.cz" + link)
        if response.status_code == 200:
            html = response.text
            subject_data[code] = get_subject(html, code, predecessors)
        else:
            printRed(f"Failed to fetch page: {response.status_code}")

        time.sleep(REQUEST_DELAY_SECONDS)

    for subject in predecessors:
        if subject in subject_data:
            subject_data[subject]["predecessors"] = predecessors[subject]
    return subject_data


def get_subject(html: str, code: str, predecessors: dict[str, list[SubjectLink]]) \
        -> SubjectDict:
    """
    Parse a MUNI IS subject page and extract all relevant subject information.

    Extracts name, faculty, language, completion type, credits, and successor
    relationships. Also updates the shared predecessors dictionary so that
    predecessor links can be assigned after all subjects are processed.

    Parameters:
        html (str): The HTML content of the subject's MUNI IS page.
        code (str): The subject code being processed.
        predecessors (dict[str, list[SubjectLink]]): Shared dictionary that accumulates
            predecessor links across all processed subjects. Modified in place.

    Returns:
        SubjectDict: A dictionary containing all extracted subject data.
    """
    code = re.sub(r"^[^:]*:(.*)", r"\1", code)

    name = ""
    name_match = re.search(re.compile(rf"<H2>{code}\s([^<]+)", re.IGNORECASE), html)
    if name_match:
        name = name_match.group(1).strip()
    printYellow(f"{code} - {name}")

    faculty = ""
    faculty_match = re.search(re.compile(r"</H2>\s*\n\s*<b>([^<]+)</b>", re.IGNORECASE), html)
    if faculty_match:
        faculty = faculty_match.group(1).strip()
    printCyan(f"   Link: ", end="")
    print(f"{transform_code_to_link(code, faculty)}")

    language = "Čeština"
    language_match = re.search(re.compile(r"<DT>\s*<B>Vyučovací jazyk</B>\s*</DT>\s*\n\s*<DD>([^<]+)</DD>"), html)
    if language_match:
        language = language_match.group(1).strip()
    
    completion = "zk"
    completion_match = re.search(re.compile(r"Ukončení:\s*(z|k|zk|SZk|SDzk)\.", re.IGNORECASE), html)
    if completion_match:
        completion = completion_match.group(1)
    printCyan("   Information: ", end="")
    print(f"{faculty} / {language} / {completion}")

    credit = 0
    credit_match = re.search(re.compile(r"[0-9]/[0-9](?:/[0-9])?\.\s([0-9][0-9]?)\skr\.\s(\(plus ukončení\)\.)?", re.IGNORECASE), html)
    
    if credit_match:
        credit = int(credit_match.group(1))
        if (credit_match.group(2)):
            if completion == "zk":
                credit = int(credit) + 2
            if completion == "k":
                credit = int(credit) + 1
    printCyan("   Credits: ", end="")
    print(f"{credit} kr.")


    successor_codes = find_successor_codes(html, code, True)
    soft_successors = find_successor_codes(html, code, False)
    for succ_code, data in soft_successors.items():
        if succ_code not in successor_codes:
            successor_codes[succ_code] = data

    formatted_successors: list[SubjectLink] = [{"code" : code, "groups": groups, "by_prerequisites": by_prerequisites}
                                               for code, (groups, by_prerequisites) in successor_codes.items()]
    for successor in formatted_successors:
        printCyan("   Successor: ", end="")
        print(f"{successor['code']} (groups: {successor['groups']}, by_prerequisites: {successor['by_prerequisites']})")
    print("")

    for successor in formatted_successors:
        temp_subject: SubjectLink = {"code" : code, "groups": successor["groups"], "by_prerequisites": successor["by_prerequisites"]}
        if not successor["code"] in predecessors:
            predecessors[successor["code"]] = [temp_subject]
        elif temp_subject not in predecessors[successor["code"]]:
            predecessors[successor["code"]].append(temp_subject)

    return {"name": name, "faculty": transform_faculty(faculty),
            "successors": list(formatted_successors), "language": transform_language(language),
            "predecessors": [],
            "completion": completion,
            "credits": int(credit), "link": transform_code_to_link(code, faculty),
            "type" : code_to_subj_type(code)}


def transform_faculty(full_faculty_name: str) -> str:
    match full_faculty_name:
        case "Fakulta informatiky":
            return "FI"
        case "Přírodovědecká fakulta":
            return "PřF"
        case _:
            return "Unknown faculty"


def transform_language(full_language_name: str) -> str:
    match full_language_name:
        case "Čeština":
            return "CZE"
        case "Angličtina":
            return "ENG"
        case _:
            return "Unknown language"


def code_to_subj_type(code: str) -> str:
    code = code.replace("PřF:", "")
    if code[0] == "P" or code[0] == "I":
        return "IN"
    if code[0] == "C" or code[0:2] == "Bi":
        return "BI"
    if code[0] == "M":
        return "MA"
    return "OT"

def printYellow(s: str, end: str="\n") -> None: print("\033[93m {}\033[00m".format(s), end=end)
def printCyan(s: str, end: str ="\n") -> None: print("\033[96m {}\033[00m".format(s), end=end)
def printRed(s: Exception | str, end: str="\n") -> None: print("\033[91m {}\033[00m".format(s), end=end)

def build_final_json(data: ResultData, successors: SubjectSuccessors, path: str) -> None:
    final_json: FinalJson = {
                        "details": successors,
                        "spec": data["spec"],
                        "choices": data["choices"],
                        "substitutions": MANUAL_SUBSTITUTIONS
                    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(final_json, f, indent=4, ensure_ascii=False)


def main() -> None:
    print("Extracting names from input JSON file...")
    data = extract_codes("./bc_bio_cz.json")
    subject_dict = build_subject_dict(data)

    print("Almost finished. Building the final JSON file...")
    build_final_json(data, subject_dict, "../../data/processed_data.json")
    print("Done.")

if __name__ == "__main__":
    main()