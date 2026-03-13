/**
 * CSV to JSON Converter
 * Converts CSV data to JSON format and pushes to OpenClawTest repository
 */

interface CsvToJsonOptions {
  delimiter?: string;
  skipHeader?: boolean;
}

/**
 * Converts CSV string to JSON array
 * @param csv - CSV string input
 * @param options - Conversion options
 * @returns JSON array of objects
 */
export function csvToJson(csv: string, options: CsvToJsonOptions = {}): Record<string, any>[] {
  const { delimiter = ',', skipHeader = false } = options;
  
  if (!csv.trim()) {
    return [];
  }

  const lines = csv.trim().split('\n');
  if (lines.length === 0) {
    return [];
  }

  // Parse header
  const headers = skipHeader 
    ? Array.from({ length: lines[0].split(delimiter).length }, (_, i) => `column${i}`)
    : parseCsvLine(lines[0], delimiter);

  // Parse data rows
  const startIndex = skipHeader ? 0 : 1;
  const jsonData: Record<string, any>[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const row = parseCsvLine(lines[i], delimiter);
    if (row.length === headers.length) {
      const obj: Record<string, any> = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      jsonData.push(obj);
    }
  }

  return jsonData;
}

/**
 * Parses a single CSV line handling quoted fields
 * @param line - CSV line to parse
 * @param delimiter - Field delimiter
 * @returns Array of parsed fields
 */
function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Pushes JSON data to OpenClawTest repository
 * @param jsonData - JSON data to push
 * @param filename - Output filename
 */
export async function pushToRepo(jsonData: any[], filename: string): Promise<void> {
  try {
    // Create output directory if it doesn't exist
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');
    
    const outputPath = path.join(process.cwd(), 'output');
    await fs.mkdir(outputPath, { recursive: true });
    
    // Write JSON file
    const filePath = path.join(outputPath, filename);
    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
    
    console.log(`✅ JSON file created: ${filePath}`);
    
    // Git commands to push to repository
    const { exec } = await import('child_process');
    const util = await import('util');
    const execAsync = util.promisify(exec);
    
    await execAsync('git add .');
    await execAsync(`git commit -m "feat: add ${filename} from CSV conversion"`);
    await execAsync('git push origin main');
    
    console.log('🚀 Successfully pushed to OpenClawTest repository!');
  } catch (error) {
    console.error('❌ Error pushing to repository:', error);
    throw error;
  }
}

// Example usage
/*
const csvData = \`name,age,city
John,30,"New York"
Jane,25,"San Francisco"\`;

const jsonResult = csvToJson(csvData);
console.log(JSON.stringify(jsonResult, null, 2));

// To push to repo:
// pushToRepo(jsonResult, 'converted-data.json');
*/