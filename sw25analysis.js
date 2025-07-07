function escapeHTML(str) {
      return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag]));
    }

    function normalizeName(name) {
      return name.normalize("NFKC").trim();
    }

    function analyzeLog() {
      const log = document.getElementById("logInput").value;
      const excludeText = document.getElementById("excludeInput").value;
      const sortOption = document.getElementById("sortSelect").value;
      const excludeNames = excludeText.split(",").map(s => s.trim()).filter(Boolean);

      const lines = log.split("\n");
      const diceData = {};
      const histogram = {};

      const regexStandard = /\[.*?\]\s+([^\]:]+?)\s*:\s.*?＞\s*\d+\[(\d+),(\d+)\]/g;
      const regexMulti = /\[.*?\]\s+([^\]:]+?)\s*:/;
      const regex2D = /2D:\[(\d+),(\d+)\]/g;

      for (const line of lines) {
        if (!line.includes("＞") && !line.includes("2D:[")) continue;

        let match;
        while ((match = regexStandard.exec(line)) !== null) {
          let name = normalizeName(match[1]);
          if (excludeNames.some(ex => name.includes(ex))) continue;
          const d1 = parseInt(match[2]);
          const d2 = parseInt(match[3]);
          if (d1 < 1 || d1 > 6 || d2 < 1 || d2 > 6) continue;

          const total = d1 + d2;
          if (!diceData[name]) {
            diceData[name] = [];
            histogram[name] = {};
          }
          diceData[name].push(total);
          histogram[name][total] = (histogram[name][total] || 0) + 1;
        }

        const nameMatch = regexMulti.exec(line);
        if (nameMatch) {
          let name = normalizeName(nameMatch[1]);
          if (excludeNames.some(ex => name.includes(ex))) continue;

          let diceMatch;
          while ((diceMatch = regex2D.exec(line)) !== null) {
            const d1 = parseInt(diceMatch[1]);
            const d2 = parseInt(diceMatch[2]);
            if (d1 < 1 || d1 > 6 || d2 < 1 || d2 > 6) continue;

            const total = d1 + d2;
            if (!diceData[name]) {
              diceData[name] = [];
              histogram[name] = {};
            }
            diceData[name].push(total);
            histogram[name][total] = (histogram[name][total] || 0) + 1;
          }
        }
      }

      const resultDiv = document.getElementById("result");
      if (Object.keys(diceData).length === 0) {
        resultDiv.innerHTML = "<p>⚠ 出目が見つかりませんでした。</p>";
        return;
      }

      const dataList = Object.keys(diceData).map(name => {
        const rolls = diceData[name];
        const count = rolls.length;
        const average = rolls.reduce((a, b) => a + b, 0) / count;
        return { name, count, average };
      });

      if (sortOption === "count") {
        dataList.sort((a, b) => b.count - a.count);
      } else if (sortOption === "average") {
        dataList.sort((a, b) => b.average - a.average);
      } else if (sortOption === "name") {
        dataList.sort((a, b) => a.name.localeCompare(b.name, "ja"));
      }

      let html = "<h2>📊 出目統計結果</h2>";
      html += "<table><tr><th>PC名</th><th>回数</th><th>平均出目</th>";
      for (let i = 2; i <= 12; i++) {
        html += `<th>${i}</th>`;
      }
      html += "</tr>";

      for (const data of dataList) {
        html += `<tr><td>${escapeHTML(data.name)}</td><td>${data.count}</td><td>${data.average.toFixed(2)}</td>`;
        for (let i = 2; i <= 12; i++) {
          html += `<td>${histogram[data.name][i] || 0}</td>`;
        }
        html += "</tr>";
      }

      html += "</table>";
      resultDiv.innerHTML = html;
    }
