import re
import pandas as pd

# Paste your summary lines into a list (can also read from file if needed)
summary_lines = """
summary =    100 in 00:00:03 =   32.2/s Avg:  2264 Min:  1625 Max:  2784 Err:     0 (0.00%)
summary =    500 in 00:00:07 =   69.1/s Avg:  5000 Min:  2787 Max:  6647 Err:     0 (0.00%)
summary =   1000 in 00:00:11 =   87.6/s Avg:  7375 Min:  2057 Max: 10769 Err:     0 (0.00%)
summary =   3000 in 00:00:22 =  136.2/s Avg:  6268 Min:    44 Max: 17020 Err:     10(0.00%)
summary =   5000 in 00:00:30 =  168.0/s Avg:  3604 Min:    20 Max: 13407 Err:    79 (1.58%)
summary =  10000 in 00:00:51 =  195.5/s Avg:  4227 Min:    20 Max: 19039 Err:  1640 (16.40%)
summary =    100 in 00:00:05 =   20.3/s Avg:  2491 Min:  1900 Max:  2950 Err:     0 (0.00%)
summary =    500 in 00:00:10 =   51.1/s Avg:  4964 Min:  2448 Max:  7040 Err:     0 (0.00%)
summary =   1000 in 00:00:14 =   72.1/s Avg:  6898 Min:  2835 Max: 10518 Err:    23 (2.30%)
summary =    100 in 00:00:05 =   20.1/s Avg:  2629 Min:  2333 Max:  3051 Err:     0 (0.00%)
summary =    500 in 00:00:09 =   57.5/s Avg:  4069 Min:  2362 Max:  5936 Err:     0 (0.00%)
summary =   1000 in 00:00:14 =   74.0/s Avg:  7889 Min:  5161 Max: 10421 Err:     0 (0.00%)
summary =   3000 in 00:00:22 =  134.6/s Avg: 12449 Min:  6297 Max: 17326 Err:     0 (0.00%)
summary =   5000 in 00:00:34 =  148.7/s Avg: 14764 Min:    52 Max: 28612 Err:     0 (0.00%)
summary =  10000 in 00:00:51 =  195.1/s Avg:  7105 Min:    18 Max: 27126 Err:     0 (0.00%)
summary =  20000 in 00:01:24 =  238.6/s Avg:  4362 Min:    12 Max: 30970 Err:  4009 (20.04%)
summary =    100 in 00:00:07 =   14.3/s Avg:  3698 Min:  1184 Max:  6548 Err:     0 (0.00%)
summary =    500 in 00:00:17 =   29.0/s Avg:  7249 Min:  2497 Max: 16646 Err:    61 (12.20%)
summary =   1000 in 00:00:20 =   50.1/s Avg:  7930 Min:   966 Max: 19368 Err:   461 (46.10%)
summary =    100 in 00:00:06 =   15.7/s Avg:  3587 Min:  1908 Max:  5818 Err:     0 (0.00%)
summary =    500 in 00:00:14 =   35.2/s Avg:  6531 Min:  2609 Max: 13682 Err:    64 (12.80%)
summary =   1000 in 00:00:17 =   60.0/s Avg:  8422 Min:  1925 Max: 15858 Err:    80 (8.00%)
""".strip().splitlines()

pattern = re.compile(r"summary\s*=\s*(\d+).*?=\s*([\d.]+)/s\s*Avg:\s*(\d+).*?Err:\s*\d+\s*\(([\d.]+)%\)")

records = []
for line in summary_lines:
    m = pattern.search(line)
    if m:
        users = int(m.group(1))
        throughput = f"{m.group(2)}/s"
        avg = int(m.group(3))
        error = f"{m.group(4)}%"
        records.append([users, avg, error, throughput])

df = pd.DataFrame(records, columns=["Users", "Avg", "Error", "Throughput"])
df.to_csv("parsed_jmeter.csv", index=False)

print("Saved parsed_jmeter.csv")
print(df.head())
