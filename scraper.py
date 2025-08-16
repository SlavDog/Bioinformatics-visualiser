import re
import json
import requests
import time
from typing import Any
from sympy import Symbol, simplify_logic
from bs4 import BeautifulSoup

class SubjectInfo:
    def __init__(self, name: str, faculty: str, code: str, language: str, completion: str, successors: list[str]):
        self.name = name
        self.faculty = faculty
        self.code = code
        self.language = language
        self.completion = completion
        self.successors = successors
        self.has_successors = False
        self.has_parent = False

SubjectSuccessors = dict[str, list[str]]


def extract_codes(filename: str) -> list[str]:
    """
    Extract all subject codes from MUNI-style JSON file.

    Parameters:
        filename (str): Name of the input file.

    Returns:
        list[str]: A list containing all subject codes.
    """
    code_list = []
    with open(filename, "r", encoding='utf-8') as source:
        data = json.load(source)

        # Write down all base subjects
        for subject in data["base"]:
            if "code" in subject:
                code_list.append(subject["code"])                
            elif "choice" in subject:
                continue

        # Write down every subject from a certain choice group
        for choice in data["choices"]:
            if "tv" == choice or "core" == choice: # we must ignore CORE and PE
                continue
            for subject_code in data["choices"][choice]["list"]:
                code_list.append(subject_code)

        # Write down all specialization subjects
        for specialization in data["spec"].values():
            for subject in specialization["base"]:
                if "choice" in subject:
                    continue
                code_list.append(subject["code"])

    return code_list


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

    pattern = re.compile(r'<a href="/(?:auth/)?predmet/[^"]+"><b>([^<>]+)</b>.*?</a><br\s*/>\s*\n?(.*?)(?=&nbsp;)', re.IGNORECASE)
    if not by_prerequisites:
        pattern = re.compile(r'<a href="(?:/(?:auth/)?predmet/[^"]+)"><b>([^<]+)</b>(?:.*?)</a>', re.IGNORECASE)
        return pattern.findall(section)
    
    found_subjects_with_prerequisites = pattern.findall(section)

    for successor_subject, formula in found_subjects_with_prerequisites:
        formula = BeautifulSoup(formula, "html.parser").get_text() # clean from HTML tags
        try: 
            parse_and_evaluate_formula(code, formula)
            result.append(successor_subject)
        except:
            print(f"Couldn't evaluate prerequisite formula {formula} for subject {successor_subject}. Skipping.")
            
    return result
    

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


def transform_code_to_link(code: str) -> str:
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
    else:
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


def build_successor_dict(by_prerequisites: bool, subject_codes: list[str]) \
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
    result: SubjectSuccessors = {}
    for code in subject_codes:
        link = transform_code_to_link(code)

        response = requests.get(f"https://is.muni.cz" + link)
        if response.status_code == 200:
            html = response.text
            result[code] = get_subject(html, code, by_prerequisites)
        else:
            print("Failed to fetch page:", response.status_code)

        time.sleep(1)

    return result

def get_subject(html: str, code: str, by_prerequisites: bool) \
        -> tuple[str, str, str, str]:
    code = re.sub(r"^[^:]*:(.*)", r"\1", code)
    name_match = re.search(re.compile(rf"<H2>{code}\s([^<]+)", re.IGNORECASE), html)
    name = name_match.group(1).strip()
    print(f"{code} - {name}")

    faculty_match = re.search(re.compile(r"</H2>\s*\n\s*<b>([^<]+)</b>", re.IGNORECASE), html)
    faculty = faculty_match.group(1).strip()

    language = "Čeština"
    language_match = re.search(re.compile(r"<DT>\s*<B>Vyučovací jazyk</B>\s*</DT>\s*\n\s*<DD>([^<]+)</DD>"), html)
    if language_match:
        language = language_match.group(1).strip()
    
    completion_match = re.search(re.compile(r"Ukončení:\s*(z|k|zk|SZk|SDzk)\.", re.IGNORECASE), html)
    completion = completion_match.group(1)
    print(f"    {faculty} / {language} / {completion}")


    successor_codes = find_successor_codes(html, code, by_prerequisites)
    print(f"    {successor_codes}")

    return SubjectInfo(name, faculty, code, language, completion, successor_codes)


def merge_dictionaries(first_dictionary: SubjectSuccessors,
                second_dictionary: SubjectSuccessors) -> SubjectSuccessors:
    """
    Merge successor lists for each subject from two dictionaries.

    Parameters:
        first_dictionary (SubjectSuccessors): The first dictionary.
        second_dictionary (SubjectSuccessors): The second dictionary.

    Returns:
        SubjectSuccessors: The merged dictionary containing combined successor lists.
    """
    for key in second_dictionary:
        for child in second_dictionary[key].successors:
            if child not in first_dictionary[key].successors:
                first_dictionary[key].successors.append(child)

    return first_dictionary


def clean_dict(data: SubjectSuccessors) -> SubjectSuccessors:
    """
    Remove any successor subject codes that are not keys in the given dictionary.

    Parameters:
        data (dict): A dictionary where keys are subject codes and values are lists of successor codes.

    Returns:
        dict: A filtered dictionary with only successor codes that are keys in `data`.
    """
    for key in data:
        result = []
        for child in data[key].successors:
            if child in data:
                result.append(child)
        data[key].successors = [child for child in data[key].successors if child in data]
        
        if data[key].successors:
            data[key].has_successors = True
            for successor in data[key].successors:
                data[successor].has_parent = True
    return data


def build_final_json(data: SubjectSuccessors) -> None:
    """
    Build and save a final JSON file from the given subject successors dictionary.

    Parameters:
        data (SubjectSuccessors): A dictionary mapping subject codes to lists of successor codes.

    Returns:
        None
    """
    result = {"code": "root", "children": []}
    visited = {key : False for key in data}
    for key in data:
        if not visited[key]:
            result["children"].append(build_aux(key, visited, result, data))

    with open("./public/final_tree.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=4, ensure_ascii=False)


def build_aux(current: int, visited: list[bool], result: Any, data: Any):
    visited[current] = True
    children = []
    for child in data[current].successors:
        if not visited[child]:
            children.append(build_aux(child, visited, result, data))
    return {"code": current, "name": data[current].name, 
            "faculty" : data[current].faculty, "children": children,
            "language" : data[current].language, "completion" : data[current].completion,
            "has_successors" : data[current].has_successors, "has_parent" : data[current].has_parent}


def main() -> None:
    print("Extracting names from input JSON file.")
    codes = extract_codes("bc_bio_cz.json")
    print("Building the prerequisites JSON.")
    prerequisite_successors = build_successor_dict(True, codes)
    print("Building the successor JSON.")
    normal_successors = build_successor_dict(False, codes)
    print("Merging JSONs.")
    merged_successors = merge_dictionaries(prerequisite_successors, normal_successors)
    print("Cleaning the merged JSON.")
    cleaned_successors = clean_dict(merged_successors)
    print("Building the final JSON file.")
    build_final_json(cleaned_successors)


if __name__ == "__main__":
    main()