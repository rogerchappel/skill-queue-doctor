export function formatMarkdownReport(report) {
  const lines = ['# Skill Queue Doctor Report', ''];
  lines.push(`Ideas directory: \`${report.ideasDir}\``);
  lines.push('');
  lines.push('## Lane counts');
  for (const [lane, details] of Object.entries(report.lanes)) {
    lines.push(`- ${lane}: ${details.count}`);
  }
  lines.push('');
  lines.push(`Ready shortage: ${report.readyShortage}`);

  if (report.missingFolders.length > 0) {
    lines.push('', '## Missing folders');
    for (const folder of report.missingFolders) {
      lines.push(`- ${folder}`);
    }
  }

  if (report.warnings.length > 0) {
    lines.push('', '## Warnings');
    for (const warning of report.warnings) {
      lines.push(`- ${warning.lane}/${warning.file}: ${warning.message}`);
    }
  }

  if (report.duplicates.length > 0) {
    lines.push('', '## Duplicate repo names');
    for (const duplicate of report.duplicates) {
      lines.push(`- ${duplicate.lane}/${duplicate.file}: matches ${duplicate.repo}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

export function formatJsonReport(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}
