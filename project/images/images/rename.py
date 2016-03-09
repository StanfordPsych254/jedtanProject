import json
import csv
import os
from pprint import pprint

start_num = 17

for file_name in os.listdir("./"):
	if file_name != "rename.py":
		os.system("mv " + file_name + " " + str(start_num) + ".jpg")
		start_num += 1