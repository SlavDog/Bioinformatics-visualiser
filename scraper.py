import re
import json
import requests
import time
from typing import Any
from sympy import Symbol, simplify_logic


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


def find_successor_links(html: str, code: str, by_prerequisites = True) -> list[str]:
    """
    Find all successor subject codes from the desired section
    of the MUNI subject catalogue HTML page.

    Parameters:
        html (str): The HTML content of the MUNI catalogue page.
        code (str): The parent subject code.
        by_prerequisites (bool, optional): Defaults to True. Determines whether
            successors are taken from the "Nachází se v prerekvizitách" 
            section (True) or the "Navazující předměty" section (False).
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

    pattern = re.compile(r'<a href="(/(?:auth/)?predmet/[^"]+)"><b>(?:[^<]+)</b>(?:.*?)</a><br\s*/>\s*\n?(.*?)(?=&nbsp;)', re.IGNORECASE)
    if not by_prerequisites:
        pattern = re.compile(r'<a href="(/(?:auth/)?predmet/[^"]+)"><b>(?:[^<]+)</b>(?:.*?)</a>', re.IGNORECASE)
        return pattern.findall(section)
    
    found_subjects_with_prerequisites = pattern.findall(section)

    for link, formula in found_subjects_with_prerequisites:
        formula = re.sub(r"<a[^>]*>([^<]*)</a>", r"\1", formula)
        if parse_and_evaluate_formula(code, formula):
            result.append(link)
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
    # ignore all program prerequisites by replacing 
    # the whole "program(...)" with a single placeholder
    formula = re.sub(r"(?:!)?program\([^)]*\)", "PROG", formula)

    # remove NOW(...) wrapper, keep only the inner expression
    formula = re.sub(r"NOW\(([^)]*)\)", r"\1", formula)

    # replace ANY(...) or NOWANY(...) with equivalent OR expression
    # (the replace_any function is automatically called by re.sub 
    # with the match object as an argument)
    formula = re.sub(r"NOWANY\(([^)]*)\)", replace_any, formula)
    formula = re.sub(r"ANY\(([^)]*)\)", replace_any, formula)

    formula = formula.replace("&&", "&").replace("||", "|").replace("!", "~")
    
    symbols_dict = {}
    all_codes = re.findall(r"[A-Za-z0-9:_ř]+", formula)
    for i, subject_code in enumerate(set(all_codes)):
        symbols_dict[subject_code.capitalize()] = Symbol(f"a{i}")
        formula = formula.replace(subject_code, f"a{i}")

    expr = simplify_logic(formula)
    return not expr.has(~symbols_dict[code.replace("PřF:", "")
                                          .capitalize()])


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
        SubjectSuccessors: A dictionary with subject codes as keys and lists of
        successor codes as values.
    """
    result: SubjectSuccessors = {}
    for code in subject_codes:
        link = transform_code_to_link(code)

        response = requests.get(f"https://is.muni.cz" + link)
        if response.status_code == 200:
            html = response.text
            links = find_successor_links(html, code, by_prerequisites)

            if links:
                print(f"{code} has children: {links}")
            result[code] = []
            for succ_link in links:
                result[code].append(transform_link_to_code(succ_link))

        else:
            print("Failed to fetch page:", response.status_code)

        time.sleep(1)

    return result


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
        for child in second_dictionary[key]:
            if child not in first_dictionary[key]:
                first_dictionary[key].append(child)

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
        for child in data[key]:
            if child in data:
                result.append(child)
        data[key] = result
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
    for child in data[current]:
        if not visited[child]:
            children.append(build_aux(child, visited, result, data))
    return {"code": current, "children": children}


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