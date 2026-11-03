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
          body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            margin: 20px;
          }

          h1 {
            color: #333;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            table-layout: fixed; /* Added fixed layout for better alignment */
          }

          th, td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
            word-wrap: break-word; /* Ensures text wraps within the table */
            overflow: hidden; /* Prevents text overflow outside the cell */
          }

          th {
            background-color: #4CAF50;
            color: white;
          }

          tr:nth-child(even) {
            background-color: #f2f2f2;
          }

          .pass {
            color: green;
          }

          .fail {
            color: red;
          }

          .skipped {
            color: orange;
          }

          .summary {
            font-size: 1.2em;
            margin-bottom: 20px;
          }

          .summary p {
            margin: 5px 0;
          }
        </style>
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

        <!-- Single table for all test cases -->
        <table>
          <thead>
            <tr>
              <th>Test File</th>
              <th>Test Case</th>
              <th>Time (s)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <!-- Loop through each test suite -->
            <xsl:for-each select="testsuites/testsuite">
              <xsl:variable name="testfile" select="@name"/>
              <!-- Count the number of test cases in the current suite -->
              <xsl:variable name="testcaseCount" select="count(testcase)"/>

              <!-- Loop through all test cases in the suite -->
              <xsl:for-each select="testcase">
                <tr>
                  <!-- Test File Column: Only in the first row of each suite, apply rowspan -->
                  <xsl:choose>
                    <xsl:when test="position() = 1">
                      <td rowspan="{$testcaseCount}" style="vertical-align: middle; text-align: center;">
                        <xsl:value-of select="$testfile"/>
                      </td>
                    </xsl:when>
                    <xsl:otherwise>
                      <td></td>
                    </xsl:otherwise>
                  </xsl:choose>

                  <!-- Test Case Name -->
                  <td><xsl:value-of select="@name"/></td>
                  
                  <!-- Time taken for the test -->
                  <td><xsl:value-of select="@time"/></td>

                  <!-- Test Status -->
                  <td>
                    <xsl:choose>
                      <xsl:when test="failure">
                        <span class="fail">FAILED</span>
                      </xsl:when>
                      <xsl:when test="skipped">
                        <span class="skipped">SKIPPED</span>
                      </xsl:when>
                      <xsl:otherwise>
                        <span class="pass">PASSED</span>
                      </xsl:otherwise>
                    </xsl:choose>
                  </td>
                </tr>
              </xsl:for-each>
            </xsl:for-each>
          </tbody>
        </table>

      </body>
    </html>
  </xsl:template>

</xsl:stylesheet>

