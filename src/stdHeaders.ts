/**
 * Cache the file info only for std headers
 * So that getting infos from std headers can be optimized
 * 
 * Note: Do NOT cache for non std headers because they can be changed
 */

const cppStdHeaders =
[
    /*C++20 */
    "concepts",
    "coroutine",
    "version",
    "compare",
    "source_location",
    "format",
    "span",
    "ranges",
    "bit",
    "numbers",
    "syncstream",
    "stop_token",
    "semaphore",
    "latch",
    "barrier",
    /*C++17 */
    "any",
    "optional",
    "variant",
    "memory_resource",
    "string_view",
    "charconv",
    "execution",
    "filesystem",
    /*C++14 */
    "shared_mutex",
    /*C++11 */
    "typeindex",
    "type_traits",
    "chrono",
    "initializer_list",
    "tuple",
    "scoped_allocator",
    "cstdint",
    "cinttypes",
    "system_error",
    "cuchar",
    "array",
    "forward_list",
    "unordered_set",
    "unordered_map",
    "random",
    "ratio",
    "cfenv",
    "codecvt",
    "regex",
    "atomic",
    "thread",
    "mutex",
    "future",
    "condition_variable",
    /*older C++ headers */
    "cstdlib",
    "csignal",
    "csetjmp",
    "cstdarg",
    "typeinfo",
    "bitset",
    "functional",
    "utility",
    "ctime",
    "cstddef",
    "new",
    "memory",
    "climits",
    "cfloat",
    "exception",
    "stdexcept",
    "cassert",
    "cerrno",
    "cctype",
    "cwctype",
    "cstring",
    "cwchar",
    "string",
    "vector",
    "deque",
    "list",
    "set",
    "map",
    "stack",
    "queue",
    "iterator",
    "algorithm",
    "cmath",
    "complex",
    "valarray",
    "numeric",
    "locale",
    "clocale",
    "iosfwd",
    "ios",
    "istream",
    "ostream",
    "iostream",
    "fstream",
    "sstream",
    "strstream",
    "iomanip",
    "streambuf",
    "cstdio",
];

const cstdHeaders =
[
    /*C11 */
    "stdalign.h",
    "stdatomic.h",
    "stdnoreturn.h",
    "threads.h",
    "uchar.h",
    /*C99 */
    "complex.h",
    "fenv.h",
    "inttypes.h",
    "stdbool.h",
    "stdint.h",
    "tgmath.h",
    /*C95 */
    "iso646.h",
    "wchar.h",
    "wctype.h",
    /*older C headers */
    "assert.h",
    "ctype.h",
    "errno.h",
    "float.h",
    "limits.h",
    "locale.h",
    "math.h",
    "setjmp.h",
    "signal.h",
    "stdarg.h",
    "stddef.h",
    "stdio.h",
    "stdlib.h",
    "string.h",
    "time.h"
];

const stdHeaders = new Set(cppStdHeaders.concat(cstdHeaders));

export function isStdHeader(headerName: string): boolean
{
    return stdHeaders.has(headerName);
}