import json
import csv
import os
from pprint import pprint


full_output_file = open('final_results.csv', 'w')
fullwriter = csv.writer(full_output_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_ALL)

fullwriter.writerow(('Observation','WorkerID', 'Block', 'KeyPresses', 'Stimulus', 'Trial'))

for file_name in os.listdir("sandbox-results/"):
	file_name_split = file_name.split('.')[0]

	with open('sandbox-results/' + file_name_split + '.json') as data_file:    
		data = json.load(data_file)
		output_file = open(file_name.split('.')[0] + '.csv', 'w')
		writer = csv.writer(output_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_ALL)

		answers = data["answers"]["data"]["data"]

		output_file.write('')
		answers = map(lambda x:  [1+(x["trial"]-2)/20] + x.values(), answers)
		for elem in answers:
			if elem[2] is True:
				elem[2] = 1
			else:
				elem[2] = 0
		answers = map(lambda x:  x[0:4] + [(x[4]-2) % 20 + 1], answers)
		answers = map(lambda x: [file_name_split] + x, answers)
		map(lambda x: writer.writerow(tuple(x)), answers)
		map(lambda x: fullwriter.writerow(tuple(x)), answers)
		print answers
