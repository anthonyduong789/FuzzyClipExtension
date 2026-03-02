# FuzzyClipExtension
understanding the fuzzy search

- length of the match. Searching for “aa” should score higher for Cars/Saab than Cars/Toyota. (they both match)
- we implement a way to grade which string ranks higher using the Levenshtein distance algorithm

_Levenshtein distance Properties
- It is zero if and only if the strings are equal.
- It is at least the difference of the sizes of the two strings.
- at most the length of the longer string
- Triangle inequality: The Levenshtein distance between two strings is no greater than the sum of their Levenshtein distances from a third string.
