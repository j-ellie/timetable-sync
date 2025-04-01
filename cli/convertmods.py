import json

mods = []

with open("./mods.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()
    for line in lines:
        line = line.split()

        mods.append([line[0], line[1], " ".join(line[2:])])
        # mods[line[0]] = line[1]
        # mods[line[1]] = line[0]

print(mods)

with open("mods.json", "w") as jf:
    json.dump(mods, jf)