#ifndef SIMPLE_JSON_HPP
#define SIMPLE_JSON_HPP

#include <string>
#include <vector>
#include <map>
#include <sstream>
#include <iomanip>
#include <cctype>
#include <algorithm>

namespace json_utils {

inline std::string escape(const std::string& s) {
    std::ostringstream o;
    for (char c : s) {
        if (c == '"') o << "\\\"";
        else if (c == '\\') o << "\\\\";
        else if (c == '\b') o << "\\b";
        else if (c == '\f') o << "\\f";
        else if (c == '\n') o << "\\n";
        else if (c == '\r') o << "\\r";
        else if (c == '\t') o << "\\t";
        else if (static_cast<unsigned char>(c) < 32) {
            o << "\\u" << std::hex << std::setw(4) << std::setfill('0') << static_cast<int>(c);
        } else {
            o << c;
        }
    }
    return o.str();
}

inline std::string trim(const std::string& str) {
    size_t first = str.find_first_not_of(" \t\n\r");
    if (first == std::string::npos) return "";
    size_t last = str.find_last_not_of(" \t\n\r");
    return str.substr(first, (last - first + 1));
}

// Minimal, reliable JSON key-value extraction for JSON-IPC
inline std::string getString(const std::string& json, const std::string& key, const std::string& defaultVal = "") {
    std::string needle = "\"" + key + "\"";
    size_t pos = json.find(needle);
    if (pos == std::string::npos) return defaultVal;
    pos = json.find(':', pos + needle.length());
    if (pos == std::string::npos) return defaultVal;
    
    // find start quote
    size_t startQ = json.find('"', pos);
    if (startQ == std::string::npos) return defaultVal;
    size_t endQ = startQ + 1;
    while (endQ < json.length()) {
        if (json[endQ] == '"' && json[endQ - 1] != '\\') break;
        endQ++;
    }
    if (endQ >= json.length()) return defaultVal;
    return json.substr(startQ + 1, endQ - startQ - 1);
}

inline double getNumber(const std::string& json, const std::string& key, double defaultVal = 0.0) {
    std::string needle = "\"" + key + "\"";
    size_t pos = json.find(needle);
    if (pos == std::string::npos) return defaultVal;
    pos = json.find(':', pos + needle.length());
    if (pos == std::string::npos) return defaultVal;
    
    size_t start = json.find_first_of("0123456789.-", pos);
    if (start == std::string::npos) return defaultVal;
    size_t end = json.find_first_not_of("0123456789.eE+-", start);
    std::string numStr = json.substr(start, end - start);
    try {
        return std::stod(numStr);
    } catch (...) {
        return defaultVal;
    }
}

inline bool getBool(const std::string& json, const std::string& key, bool defaultVal = false) {
    std::string needle = "\"" + key + "\"";
    size_t pos = json.find(needle);
    if (pos == std::string::npos) return defaultVal;
    pos = json.find(':', pos + needle.length());
    if (pos == std::string::npos) return defaultVal;
    
    size_t t = json.find("true", pos);
    size_t f = json.find("false", pos);
    size_t nextComma = json.find_first_of(",}", pos);
    
    if (t != std::string::npos && (nextComma == std::string::npos || t < nextComma)) return true;
    if (f != std::string::npos && (nextComma == std::string::npos || f < nextComma)) return false;
    return defaultVal;
}

// Extract objects inside a JSON array
inline std::vector<std::string> getObjectArray(const std::string& json, const std::string& arrayKey) {
    std::vector<std::string> results;
    std::string needle = "\"" + arrayKey + "\"";
    size_t pos = json.find(needle);
    if (pos == std::string::npos) return results;
    
    pos = json.find('[', pos);
    if (pos == std::string::npos) return results;
    
    size_t i = pos + 1;
    int braceDepth = 0;
    size_t objStart = std::string::npos;
    bool inQuote = false;
    
    while (i < json.length()) {
        char c = json[i];
        if (c == '"' && (i == 0 || json[i - 1] != '\\')) {
            inQuote = !inQuote;
        } else if (!inQuote) {
            if (c == '{') {
                if (braceDepth == 0) objStart = i;
                braceDepth++;
            } else if (c == '}') {
                braceDepth--;
                if (braceDepth == 0 && objStart != std::string::npos) {
                    results.push_back(json.substr(objStart, i - objStart + 1));
                    objStart = std::string::npos;
                }
            } else if (c == ']' && braceDepth == 0) {
                break;
            }
        }
        i++;
    }
    return results;
}

} // namespace json_utils

#endif // SIMPLE_JSON_HPP
