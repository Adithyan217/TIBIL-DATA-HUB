<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns="http://www.w3.org/1999/xhtml">

  <xsl:output method="html" indent="yes"/>

  <xsl:template match="/">
    <html>
      <head>
        <meta charset="UTF-8"/>
        <title>JUnit Test Results</title>
        <style type="text/css">
          body { font-family: Arial, sans-serif; margin: 20px; background: #f4f4f4; color: #333; }
          h1 { color: #4CAF50; text-align: center; }
          .summary, table { background: #fff; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .summary { padding: 10px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; overflow: hidden; }
          th, td { padding: 12px; border-bottom: 1px solid #ddd; text-align: left; }
          th { background: #4CAF50; color: #fff; }
          tr:nth-child(even) { background: #f9f9f9; }
          tr:hover { background: #f1f1f1; }
          .pass    { color: green;  font-weight: bold; }
          .fail    { color: red;    font-weight: bold; }
          .skipped { color: orange; font-weight: bold; }
          .collapse { cursor: pointer; color: #4CAF50; margin: 20px 0 0; }
          .testcases { display: none; }
        </style>
        <script type="text/javascript">
          function toggleTestCases(id) {
            var tb = document.getElementById(id);
            tb.style.display = (tb.style.display === 'none') ? 'table-row-group' : 'none';
          }
        </script>
      </head>
      <body>
        <h1>JUnit Test Results</h1>

        <!-- Overall summary -->
        <div class="summary">
          <p><strong>Total Suites:</strong>
            <xsl:value-of select="count(testsuites/testsuite)"/>
          </p>
          <p><strong>Total Test Cases:</strong>
            <xsl:value-of select="sum(testsuites/testsuite/@tests)"/>
          </p>
        </div>


        <xsl:for-each select="testsuites/testsuite">
          <!-- compute counts -->
          <xsl:variable name="total"   select="number(@tests)"/>
          <xsl:variable name="failed"  select="number(@failures) + number(@errors)"/>
          <xsl:variable name="skipped" select="number(@skipped)"/>
          <xsl:variable name="passed"  select="$total - $failed - $skipped"/>

          <!-- clickable header with inline summary -->
          <h2 class="collapse"
              onclick="toggleTestCases('tc_{translate(@name, ' ', '_')}')">
            ▶ <xsl:value-of select="@name"/>
            <span style="font-size:0.9em; color:#666;">
              (<xsl:value-of select="$total"/> tests,
               <span class="pass"><xsl:value-of select="$passed"/> passed</span>
               <xsl:if test="$failed &gt; 0">, <span class="fail"><xsl:value-of select="$failed"/> failed</span></xsl:if>
               <xsl:if test="$skipped &gt; 0">, <span class="skipped"><xsl:value-of select="$skipped"/> skipped</span></xsl:if>
              )
            </span>
          </h2>

          <!-- table of test cases -->
          <table>
            <thead>
              <tr>
                <th>Test Case</th>
                <th>Time (s)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="tc_{translate(@name, ' ', '_')}" class="testcases">
              <xsl:for-each select="testcase">
                <tr>
                  <td><xsl:value-of select="@name"/></td>
                  <td><xsl:value-of select="@time"/></td>
                  <td>
                    <xsl:choose>
                      <xsl:when test="@status='fail' or failures='1'">
                        <span class="fail">FAILED</span>
                      </xsl:when>
                      <xsl:when test="@status='skip' or skipped='1'">
                        <span class="skipped">SKIPPED</span>
                      </xsl:when>
                      <xsl:otherwise>
                        <span class="pass">PASSED</span>
                      </xsl:otherwise>
                    </xsl:choose>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </xsl:for-each>

      </body>
    </html>
  </xsl:template>

</xsl:stylesheet>

