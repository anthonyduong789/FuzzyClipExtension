# FuzzyClipExtension

understanding the fuzzy search

- length of the match. Searching for “aa” should score higher for Cars/Saab than Cars/Toyota. (they both match)
- we implement a way to grade which string ranks higher using the Levenshtein distance algorithm

explanation

# Possible Algorithms to try 

### Levenshtein
    Levenshtein — edit-distance based, more typo-tolerant, works even when chars are slightly out of order

    [Levenshtein distance](https://youtu.be/eneSE4vVAOs?si=S72f21lT5N6QvuRf)
    \_Levenshtein distance Properties

    - It is zero if and only if the strings are equal.
    - It is at least the difference of the sizes of the two strings.
    - at most the length of the longer string
    - Triangle inequality: The Levenshtein distance between two strings is no greater than the sum of their Levenshtein distances from a third string.

### fzf sequential
— the classic feel: characters must appear in order (subsequence), with scoring bonuses for consecutive runs, prefix matches, CamelCase boundaries, and path separators



### Trigram — splits strings into 3-char chunks and measures overlap; good for longer strings and spell-correction






