import re
import json
import requests
import time
from sympy import Symbol, simplify_logic
from bs4 import BeautifulSoup
import os

SubjectSuccessors = dict[str, list[str]]


def extract_codes(filename: str, spec: str) -> list[str]:
    """
    Extract all subject codes from MUNI-style JSON file.

    Parameters:
        filename (str): Name of the input file.

    Returns:
        list[str]: A list containing all subject codes.
    """
    sem_to_codes, codes_to_sem = extract_order(filename, spec)
    result_data = {"codes": [], "choices": {}, "order": sem_to_codes, "codes_to_sem": codes_to_sem}
    with open(filename, "r", encoding='utf-8') as source:
        data = json.load(source)

        # Write down all base subjects
        for subject in data["base"]:
            if "code" in subject:
                result_data["codes"].append(subject["code"])                
            elif "choice" in subject:
                continue

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

    return result_data


def extract_order(filename: str, spec: str) -> list[list[str]]:
    sem_to_codes = {}
    codes_to_sem = {}
    with open(filename, "r", encoding='utf-8') as source:
        data = json.load(source)
        for i, semester in enumerate(data["spec"][spec]["plan"].values()):
            sem_to_codes[i + 1] = []
            for subject in semester:
                sem_to_codes[i + 1].append(subject)
                if "choice" in subject:
                    if "tv" == subject["choice"] or "core" == subject["choice"]:
                        continue
                    for choice_subject_code in data["choices"][subject["choice"]]["list"]:
                        codes_to_sem[choice_subject_code] = i + 1
                else:
                    codes_to_sem[subject["code"]] = i + 1
    return sem_to_codes, codes_to_sem


def find_successor_codes(html: str, code: str, by_prerequisites = True) -> list[str]:
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
        list[str]:
            All successor subject codes.
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
        return []
    section = match.group(1)

    if not by_prerequisites:
        pattern = re.compile(r'<a href="(?:/(?:auth/)?predmet/[^"]+)"><b>([^<]+)</b>(?:.*?)</a>', re.IGNORECASE)
        return [(code, False) for code in pattern.findall(section)]
    
    pattern = re.compile(r'<a href="/(?:auth/)?predmet/[^"]+"><b>([^<>]+)</b>.*?</a><br\s*/>\s*\n?(.*?)(?=&nbsp;)', re.IGNORECASE)
    
    found_subjects_with_prerequisites = pattern.findall(section)

    for successor_subject, formula in found_subjects_with_prerequisites:
        formula = BeautifulSoup(formula, "html.parser").get_text() # clean from HTML tags
        try: 
            parse_and_evaluate_formula(code, formula)
            result.append(successor_subject)
        except:
            print(f"Couldn't evaluate prerequisite formula {formula} for subject {successor_subject}. Skipping.")

    return [(code, True) for code in result]
    

def parse_and_evaluate_formula(code: str, formula: str) -> bool:
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
        bool:
            True if the subject with the given code is required for the
            successor subject, False otherwise.
    """
    # ignore all program, faculty and study major prerequisites
    formula = re.sub(re.compile(r"(?:!)?program\([^)]*\)", re.IGNORECASE), "PROG", formula)
    formula = re.sub(re.compile(r"(?:!)?typ_studia\([^)]*\)", re.IGNORECASE), "STUD", formula)
    formula = re.sub(re.compile(r"(?:!)?fakulta\([^)]*\)", re.IGNORECASE), "FAC", formula)

    # remove NOW(...) wrapper, keep only the inner expression
    formula = re.sub(re.compile(r"NOW\(([^)]*)\)", re.IGNORECASE), r"\1", formula)

    # replace ANY(...) or NOWANY(...) with equivalent OR expression
    # (the replace_any function is automatically called by re.sub 
    # with the match object as an argument)
    formula = re.sub(re.compile(r"NOWANY\(([^)]*)\)", re.IGNORECASE), replace_any, formula)
    formula = re.sub(re.compile(r"ANY\(([^)]*)\)", re.IGNORECASE), replace_any, formula)

    formula = formula.replace("&&", "&").replace("||", "|").replace("!", "~")
    
    symbols_dict = {}
    all_codes = re.findall(r"[A-Za-z0-9:_ř]+", formula)
    for i, subject_code in enumerate(set(all_codes)):
        symbols_dict[subject_code.capitalize()] = Symbol(f"a{i}")
        formula = formula.replace(subject_code, f"a{i}")

    expr = simplify_logic(formula)
    code = re.sub(r"^[^:]*:(.*)", r"\1", code).capitalize()
    return not expr.has(~symbols_dict[code])


def replace_any(match):
    args = match.group(1).split(",")
    args = [arg.strip() for arg in args]
    return "(" + " | ".join(args) + ")"


def transform_code_to_link(code: str, faculty: str = "") -> str:
    """
    Transform a subject code into a URL path.

    Parameters:
        code (str): The subject code to transform.

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


def build_successor_dict(data) \
        -> SubjectSuccessors:
    """
    Build a dictionary mapping subject codes to their successor codes.

    Parameters:
        by_prerequisites (bool): Determines whether successors are taken from
            the "Nachází se v prerekvizitách" section (True) or the
            "Navazující předměty" section (False).
        subject_codes (list[str]): List of subject codes that should be included.

    Returns:
        
    """
    subject_codes = data["codes"]
    subject_data = {}
    predecessors = {}

    for code in subject_codes:
        link = transform_code_to_link(code)

        response = requests.get(f"https://is.muni.cz" + link)
        if response.status_code == 200:
            html = response.text
            semester = "null" if not code in data["codes_to_sem"] else data["codes_to_sem"][code]
            subject_data[code] = get_subject(html, code, semester, predecessors)
        else:
            print("Failed to fetch page:", response.status_code)

        time.sleep(1)

    for subject in predecessors:
        if subject in subject_data:
            subject_data[subject]["predecessors"] = predecessors[subject]
    return subject_data


def get_subject(html: str, code: str, semester, predecessors) \
        -> tuple[str, str, str, str]:
    code = re.sub(r"^[^:]*:(.*)", r"\1", code)
    name_match = re.search(re.compile(rf"<H2>{code}\s([^<]+)", re.IGNORECASE), html)
    name = name_match.group(1).strip()
    print(f"{code} - {name}")

    faculty_match = re.search(re.compile(r"</H2>\s*\n\s*<b>([^<]+)</b>", re.IGNORECASE), html)
    faculty = faculty_match.group(1).strip()

    print(transform_code_to_link(code, faculty))

    language = "Čeština"
    language_match = re.search(re.compile(r"<DT>\s*<B>Vyučovací jazyk</B>\s*</DT>\s*\n\s*<DD>([^<]+)</DD>"), html)
    if language_match:
        language = language_match.group(1).strip()
    
    completion_match = re.search(re.compile(r"Ukončení:\s*(z|k|zk|SZk|SDzk)\.", re.IGNORECASE), html)
    completion = completion_match.group(1)
    print(f"    {faculty} / {language} / {completion}")

    credit_match = re.search(re.compile(r"[0-9]/[0-9](?:/[0-9])?\.\s([0-9][0-9]?)\skr\.\s(\(plus ukončení\)\.)?", re.IGNORECASE), html)
    credit = credit_match.group(1)
    if (credit_match.group(2)):
        if completion == "zk":
            credit = str(int(credit) + 2)
        if completion == "k":
            credit = str(int(credit) + 1)
    print(f"    {credit} kr.")


    successor_codes = set(find_successor_codes(html, code, False)) \
                          .union(find_successor_codes(html, code, True))
    successor_codes = [{"code" : code, "by_prerequisites": by_prerequisites} for code, by_prerequisites in successor_codes]
    print(f"    {successor_codes if successor_codes else "{}"}")

    for successor in successor_codes:
        temp_subject = {"code" : code, "by_prerequisites": successor["by_prerequisites"]}
        if not successor["code"] in predecessors:
            predecessors[successor["code"]] = [temp_subject]
        else:
            predecessors[successor["code"]].append(temp_subject)
    print("--------")
    print(predecessors)

    return {"name": name, "faculty": transform_faculty(faculty),
            "successors": list(successor_codes), "language": transform_language(language),
            "predecessors": [],
            "completion": completion,
            "credits": credit, "link": transform_code_to_link(code, faculty),
            "semester" : semester, "type" : code_to_subj_type(code)}


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


def clean_dict(data):
    """
    Remove any successor subject codes that are not keys in the given dictionary.

    Parameters:
        data (dict): A dictionary where keys are subject codes and values are lists of successor codes.

    Returns:
        dict: A filtered dictionary with only successor codes that are keys in `data`.
    """
    for key in data:
        result = []
        for child in data[key]["successors"]:
            if child["code"] in data:
                result.append(child)
        data[key]["successors"] = [child for child in data[key]["successors"] if child["code"] in data]
    return data


def code_to_subj_type(code: str) -> str:
    code = code.replace("PřF:", "")
    if code[0] == "P" or code[0] == "I":
        return "IN"
    if code[0] == "C" or code[0:2] == "Bi":
        return "BI"
    if code[0] == "M":
        return "MA"
    return "OT"


def build_final_json(data, cleaned_successors) -> None:
    filtered_dict = {
                        "details": cleaned_successors,
                        "order": data["order"],
                        "choices": data["choices"]
                    }
    with open("./src/final_tree.json", "w", encoding="utf-8") as f:
        json.dump(filtered_dict, f, indent=4, ensure_ascii=False)


def main() -> None:
    print("Extracting names from input JSON file.")
    data = extract_codes(os.path.join("src", "data", "bc_bio_cz.json"), "apl")
    print(data)
    successors = build_successor_dict(data)
    print("Cleaning the unneccessary subjects.")
    cleaned_successors = clean_dict(successors)

    print("Building the final JSON files.")
    build_final_json(data, cleaned_successors)


if __name__ == "__main__":
    main()